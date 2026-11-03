# =====================================================================
# routers/checkins.py : 아침 체크인 (지난밤 수면 시간, 전날 걸음 수)
# ---------------------------------------------------------------------
# 규칙 판정(collect_context)은 '오늘 체크인의 수면 시간'을 읽는다.
# 체크인이 없으면 판정 상태가 PARTIAL(빠진 자료: MORNING_CHECKIN)이 된다.
# 이 API로 체크인을 넣으면, 그 뒤 통증 기록부터 COMPLETED가 될 수 있다.
# =====================================================================
from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user
from app.services.users import user_timezone
from app.timeutil import local_today

router = APIRouter(prefix="/api", tags=["아침 체크인"])


class CheckinIn(BaseModel):
    """[요청] 오늘 체크인. 날짜는 받지 않는다 → 서버가 사용자 시간대로 '오늘'을 정함"""

    sleep_minutes: int = Field(
        ..., ge=0, le=1440, examples=[420], description="지난밤 수면 시간(분)"
    )
    prev_day_steps: int | None = Field(
        None, ge=0, le=100000, examples=[5200], description="전날 걸음 수"
    )


def load_checkin(conn, user_id: str, d):
    row = (
        conn.execute(
            text("""
        SELECT checkin_date, sleep_minutes, prev_day_steps
        FROM morning_checkins WHERE user_id = :u AND checkin_date = :d
    """),
            {"u": user_id, "d": d},
        )
        .mappings()
        .first()
    )
    return dict(row) if row else None


# ---------------------------------------------------------------------
# PUT /api/checkins/today : 오늘 체크인 저장 (이미 있으면 고침)
# ---------------------------------------------------------------------
# 하루 1번만 저장되도록 DB에 UNIQUE(user_id, checkin_date)가 걸려 있다.
# 두 번째로 보내면 에러 대신 '고치기'로 처리 → 잘못 입력해도 다시 보내면 됨
@router.put("/checkins/today")
def put_today(body: CheckinIn, user_id: str = Depends(get_current_user)):
    with engine.begin() as conn:
        tz = user_timezone(conn, user_id)
        today = local_today(tz)  # 한국 사용자면 한국 날짜 (UTC 날짜가 아님)
        conn.execute(
            text("""
            INSERT INTO morning_checkins (user_id, checkin_date, sleep_minutes, prev_day_steps)
            VALUES (:u, :d, :sl, :st)
            ON DUPLICATE KEY UPDATE sleep_minutes = VALUES(sleep_minutes),
                                    prev_day_steps = VALUES(prev_day_steps)
        """),
            {
                "u": user_id,
                "d": today,
                "sl": body.sleep_minutes,
                "st": body.prev_day_steps,
            },
        )
        return {"timezone": tz, **load_checkin(conn, user_id, today)}


# ---------------------------------------------------------------------
# GET /api/checkins?days=7 : 최근 N일 체크인 (오늘 포함)
# ---------------------------------------------------------------------
# 체크인을 안 한 날도 목록에 넣고 값을 null로 둔다 → 화면에서 '빈 날'을 바로 보여 줄 수 있게
@router.get("/checkins")
def list_checkins(
    days: int = Query(7, ge=1, le=31), user_id: str = Depends(get_current_user)
):
    with engine.connect() as conn:
        tz = user_timezone(conn, user_id)
        today = local_today(tz)
        start = today - timedelta(days=days - 1)
        rows = (
            conn.execute(
                text("""
            SELECT checkin_date, sleep_minutes, prev_day_steps
            FROM morning_checkins
            WHERE user_id = :u AND checkin_date BETWEEN :s AND :e
        """),
                {"u": user_id, "s": start, "e": today},
            )
            .mappings()
            .all()
        )
    by_date = {r["checkin_date"]: dict(r) for r in rows}
    items = []
    for i in range(days):  # 오래된 날 → 오늘 순서
        d = start + timedelta(days=i)
        items.append(
            by_date.get(
                d, {"checkin_date": d, "sleep_minutes": None, "prev_day_steps": None}
            )
        )
    return {"timezone": tz, "today": today, "items": items}
