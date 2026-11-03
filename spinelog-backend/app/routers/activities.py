# =====================================================================
# routers/activities.py : 활동 기록 (예: 장시간 운전 2시간, 이삿짐 나르기 30분)
# ---------------------------------------------------------------------
# 활동 종류(activity_types)마다 동작 태그(movement_tags: 숙이기, 들기, 장시간 앉기 …)가 붙어 있다.
# 규칙 판정(collect_context)은 '어제 0시(현지) 이후 활동'의 동작 태그를 모아서
# 규칙의 target_tag_id와 비교한다. → 이 API로 활동을 넣어야 활동 조건 규칙이 동작한다.
#
# ※ 먼저 deploy/migrations/003_api_support.sql 실행 필요
#    (activity_logs.idx에 AUTO_INCREMENT가 없어서 저장이 안 됨)
# =====================================================================
from datetime import UTC, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import AwareDatetime, BaseModel, Field
from sqlalchemy import bindparam, text

from app.db import engine
from app.deps import get_current_user
from app.services.users import user_timezone
from app.timeutil import as_utc, local_date_range_utc, local_today, utc_now

router = APIRouter(prefix="/api", tags=["활동 기록"])


class ActivityTypeIn(BaseModel):
    """[요청] 내가 쓸 활동 종류 만들기 (예: '장거리 운전' + 태그 [장시간 앉기, 진동])"""

    type_label: str = Field(..., min_length=1, max_length=255, examples=["장거리 운전"])
    category_id: int | None = None
    tag_ids: list[int] = Field(default_factory=list, examples=[[5, 9]])


class ActivityLogIn(BaseModel):
    """[요청] 활동 기록. started_at은 시간대가 붙은 시각만 받음 (예: 2026-10-27T09:00:00+09:00)"""

    activity_type_id: int
    started_at: AwareDatetime = Field(..., examples=["2026-10-27T09:00:00+09:00"])
    duration_minutes: int = Field(..., ge=1, le=1440, examples=[120])
    intensity: int | None = Field(None, ge=1, le=5, description="강도 1~5")
    memo: str | None = None


def visible_type(conn, type_id: int, user_id: str):
    """내가 쓸 수 있는 활동 종류인지: 공용(user_id NULL) 또는 내가 만든 것"""
    return (
        conn.execute(
            text("""
        SELECT activity_type_id, type_label FROM activity_types
        WHERE activity_type_id = :t AND (user_id IS NULL OR user_id = :u)
    """),
            {"t": type_id, "u": user_id},
        )
        .mappings()
        .first()
    )


def type_tags(conn, type_ids: list[int]) -> dict[int, list[dict]]:
    """활동 종류 번호 → 동작 태그 목록"""
    if not type_ids:
        return {}
    # IN (:ids) 에 목록을 넣으려면 expanding=True (목록 길이만큼 ?를 자동으로 만들어 줌)
    q = text("""
        SELECT att.activity_type_id, mt.tag_id, mt.tag_code, mt.tag_label
        FROM activity_type_tags att JOIN movement_tags mt ON mt.tag_id = att.tag_id
        WHERE att.activity_type_id IN :ids
        ORDER BY mt.tag_id
    """).bindparams(bindparam("ids", expanding=True))
    rows = conn.execute(q, {"ids": list(type_ids)}).mappings().all()
    out: dict[int, list[dict]] = {}
    for r in rows:
        out.setdefault(r["activity_type_id"], []).append(
            {
                "tag_id": r["tag_id"],
                "tag_code": r["tag_code"],
                "tag_label": r["tag_label"],
            }
        )
    return out


# ---------------------------------------------------------------------
# GET /api/activity-options : 활동 기록 화면의 선택지
# ---------------------------------------------------------------------
@router.get("/activity-options")
def activity_options(user_id: str = Depends(get_current_user)):
    with engine.connect() as conn:
        categories = (
            conn.execute(
                text(
                    "SELECT category_id, category_label FROM activity_categories ORDER BY category_id"
                )
            )
            .mappings()
            .all()
        )
        tags = (
            conn.execute(
                text(
                    "SELECT tag_id, tag_code, tag_label, description FROM movement_tags ORDER BY tag_id"
                )
            )
            .mappings()
            .all()
        )
        types = (
            conn.execute(
                text("""
            SELECT activity_type_id, type_label, category_id, (user_id IS NOT NULL) AS is_mine
            FROM activity_types WHERE user_id IS NULL OR user_id = :u
            ORDER BY activity_type_id
        """),
                {"u": user_id},
            )
            .mappings()
            .all()
        )
        tag_map = type_tags(conn, [t["activity_type_id"] for t in types])
    return {
        "categories": [dict(r) for r in categories],
        "movement_tags": [dict(r) for r in tags],
        "activity_types": [
            {
                **dict(t),
                "is_mine": bool(t["is_mine"]),
                "tags": tag_map.get(t["activity_type_id"], []),
            }
            for t in types
        ],
    }


# ---------------------------------------------------------------------
# POST /api/activity-types : 내 활동 종류 만들기 (+ 동작 태그 연결)
# ---------------------------------------------------------------------
@router.post("/activity-types", status_code=201)
def create_activity_type(
    body: ActivityTypeIn, user_id: str = Depends(get_current_user)
):
    if len(body.tag_ids) != len(set(body.tag_ids)):
        raise HTTPException(422, "같은 태그가 두 번 들어 있습니다")
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        if (
            body.category_id is not None
            and conn.execute(
                text("SELECT 1 FROM activity_categories WHERE category_id = :c"),
                {"c": body.category_id},
            ).first()
            is None
        ):
            raise HTTPException(422, "없는 활동 분류입니다")
        for t in body.tag_ids:
            if (
                conn.execute(
                    text("SELECT 1 FROM movement_tags WHERE tag_id = :t"), {"t": t}
                ).first()
                is None
            ):
                raise HTTPException(422, f"없는 동작 태그입니다: {t}")
        res = conn.execute(
            text("""
            INSERT INTO activity_types (category_id, type_label, user_id) VALUES (:c, :l, :u)
        """),
            {"c": body.category_id, "l": body.type_label.strip(), "u": user_id},
        )
        type_id = res.lastrowid
        for t in body.tag_ids:
            conn.execute(
                text(
                    "INSERT INTO activity_type_tags (activity_type_id, tag_id) VALUES (:a, :t)"
                ),
                {"a": type_id, "t": t},
            )
        return {
            "activity_type_id": type_id,
            "type_label": body.type_label.strip(),
            "category_id": body.category_id,
            "tags": type_tags(conn, [type_id]).get(type_id, []),
        }


# ---------------------------------------------------------------------
# POST /api/activity-logs : 활동 기록 저장
# ---------------------------------------------------------------------
@router.post("/activity-logs", status_code=201)
def create_activity_log(body: ActivityLogIn, user_id: str = Depends(get_current_user)):
    # 시간대가 붙은 시각(+09:00)을 UTC로 바꾸고 표시를 뗀다 → DB 저장 규칙(표시 없는 UTC)과 맞춤
    started_utc = body.started_at.astimezone(UTC).replace(tzinfo=None, microsecond=0)
    now = utc_now()
    if started_utc > now + timedelta(minutes=5):  # 시계 오차 5분은 봐줌
        raise HTTPException(422, "아직 오지 않은 시각입니다")
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        if visible_type(conn, body.activity_type_id, user_id) is None:
            raise HTTPException(422, "없는 활동 종류입니다")
        res = conn.execute(
            text("""
            INSERT INTO activity_logs (user_id, activity_type_id, started_at, duration_minutes,
                                       intensity, memo, recorded_at)
            VALUES (:u, :t, :s, :d, :i, :m, :r)
        """),
            {
                "u": user_id,
                "t": body.activity_type_id,
                "s": started_utc,
                "d": body.duration_minutes,
                "i": body.intensity,
                "m": body.memo,
                "r": now,
            },
        )
        return load_activity(conn, res.lastrowid)


def load_activity(conn, idx: int) -> dict:
    row = (
        conn.execute(
            text("""
        SELECT al.idx AS activity_log_id, al.activity_type_id, at.type_label,
               al.started_at, al.duration_minutes, al.intensity, al.memo
        FROM activity_logs al LEFT JOIN activity_types at ON at.activity_type_id = al.activity_type_id
        WHERE al.idx = :i
    """),
            {"i": idx},
        )
        .mappings()
        .one()
    )
    tags = type_tags(conn, [row["activity_type_id"]] if row["activity_type_id"] else [])
    return {
        **dict(row),
        "started_at": as_utc(row["started_at"]),
        "tags": tags.get(row["activity_type_id"], []),
    }


# ---------------------------------------------------------------------
# GET /api/activity-logs?date= : 하루 활동 목록 (사용자 현지 날짜, 비우면 오늘)
# ---------------------------------------------------------------------
@router.get("/activity-logs")
def list_activity_logs(
    date_: date | None = Query(None, alias="date"),
    user_id: str = Depends(get_current_user),
):
    with engine.connect() as conn:
        tz = user_timezone(conn, user_id)
        d = date_ or local_today(tz)
        start, end = local_date_range_utc(
            tz, d
        )  # 통증 목록과 같은 방식 (현지 하루 → UTC 범위)
        ids = (
            conn.execute(
                text("""
            SELECT idx FROM activity_logs
            WHERE user_id = :u AND started_at >= :s AND started_at < :e
            ORDER BY started_at, idx
        """),
                {"u": user_id, "s": start, "e": end},
            )
            .scalars()
            .all()
        )
        items = [load_activity(conn, i) for i in ids]
    return {
        "date": d.isoformat(),
        "timezone": tz,
        "total_minutes": sum(i["duration_minutes"] for i in items),
        "items": items,
    }
