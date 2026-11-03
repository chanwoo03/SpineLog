# =====================================================================
# routers/exercise_logs.py : 운동 수행 기록 (운동 전·후 통증)
# ---------------------------------------------------------------------
# 흐름도 '5. 운동 추천 가이드'의 6번(운동 수행·운동 후 체크·결과 저장)과
# 7번(통증이 늘면 재판정)에 해당.
#   - guide_id를 같이 보내면 "어떤 판정을 보고 한 운동인지"가 남는다 (exercise_logs.guide_idx)
#   - 통증이 늘었으면 자동으로 판정을 바꾸지 않고, 통증을 다시 기록하라고 안내한다
#     (판정은 항상 '통증 기록 → 규칙 판정' 한 길로만 만들어지게)
# =====================================================================
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user
from app.services.users import user_timezone
from app.timeutil import as_utc, local_date_range_utc, local_today, utc_now

router = APIRouter(prefix="/api", tags=["운동 수행 기록"])


class ExerciseLogIn(BaseModel):
    exercise_id: int = Field(..., examples=[3])
    guide_id: int | None = Field(
        None, description="통증 기록 응답의 guides[].guide_id (판정을 보고 한 운동이면)"
    )
    duration_minutes: int | None = Field(None, ge=0, le=600, examples=[15])
    pain_before: int = Field(..., ge=0, le=10, examples=[5])
    pain_after: int = Field(..., ge=0, le=10, examples=[4])
    memo: str | None = None


def load_exercise_log(conn, log_id: int) -> dict:
    row = (
        conn.execute(
            text("""
        SELECT el.exercise_log_id, el.exercise_id, e.exercise_name, el.guide_idx AS guide_id,
               gl.level_code AS guide_level_code, gl.level_label AS guide_level_label,
               el.performed_at, el.duration_minutes, el.pain_before, el.pain_after, el.memo
        FROM exercise_logs el
        JOIN exercises e ON e.exercise_id = el.exercise_id
        LEFT JOIN pain_log_guide g ON g.idx = el.guide_idx
        LEFT JOIN guide_levels gl ON gl.guide_level_id = g.guide_level_id
        WHERE el.exercise_log_id = :i
    """),
            {"i": log_id},
        )
        .mappings()
        .one()
    )
    # 통증 변화는 저장하지 않고 계산 (pain_after - pain_before로 언제든 구할 수 있으므로 → 3정규형)
    return {
        **dict(row),
        "performed_at": as_utc(row["performed_at"]),
        "pain_change": row["pain_after"] - row["pain_before"],
    }


# ---------------------------------------------------------------------
# POST /api/exercise-logs : 운동 기록 저장
# ---------------------------------------------------------------------
@router.post("/exercise-logs", status_code=201)
def create_exercise_log(body: ExerciseLogIn, user_id: str = Depends(get_current_user)):
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        if (
            conn.execute(
                text("SELECT 1 FROM exercises WHERE exercise_id = :e"),
                {"e": body.exercise_id},
            ).first()
            is None
        ):
            raise HTTPException(422, "없는 운동입니다")
        if body.guide_id is not None:
            # 판정이 '내 통증 기록'의 것이고, 같은 운동에 대한 판정인지 확인
            g = (
                conn.execute(
                    text("""
                SELECT g.exercise_id FROM pain_log_guide g JOIN pain_logs p ON p.log_id = g.log_id
                WHERE g.idx = :g AND p.user_id = :u
            """),
                    {"g": body.guide_id, "u": user_id},
                )
                .mappings()
                .first()
            )
            if g is None:
                raise HTTPException(404, "판정 기록이 없습니다")
            if g["exercise_id"] != body.exercise_id:
                raise HTTPException(422, "판정의 운동과 기록한 운동이 다릅니다")
        res = conn.execute(
            text("""
            INSERT INTO exercise_logs (user_id, exercise_id, guide_idx, performed_at,
                                       duration_minutes, pain_before, pain_after, memo)
            VALUES (:u, :e, :g, :at, :d, :b, :a, :m)
        """),
            {
                "u": user_id,
                "e": body.exercise_id,
                "g": body.guide_id,
                "at": utc_now(),
                "d": body.duration_minutes,
                "b": body.pain_before,
                "a": body.pain_after,
                "m": body.memo,
            },
        )
        result = load_exercise_log(conn, res.lastrowid)

    # 안내 문구 (저장은 이미 끝남. 판정을 바꾸지 않고 사용자에게 알려 주기만)
    notices = []
    if result["guide_level_code"] == "CONTRAINDICATED":
        notices.append("금기 판정을 받은 운동입니다. 다음에는 피하세요.")
    if result["pain_change"] > 0:
        notices.append(
            "운동 후 통증이 늘었습니다. 지금 통증을 다시 기록하면 판정을 새로 받을 수 있습니다."
        )
    return {**result, "notices": notices}


# ---------------------------------------------------------------------
# GET /api/exercise-logs?date= : 하루 운동 기록 (현지 날짜, 비우면 오늘)
# ---------------------------------------------------------------------
@router.get("/exercise-logs")
def list_exercise_logs(
    date_: date | None = Query(None, alias="date"),
    user_id: str = Depends(get_current_user),
):
    with engine.connect() as conn:
        tz = user_timezone(conn, user_id)
        d = date_ or local_today(tz)
        start, end = local_date_range_utc(tz, d)
        ids = (
            conn.execute(
                text("""
            SELECT exercise_log_id FROM exercise_logs
            WHERE user_id = :u AND performed_at >= :s AND performed_at < :e
            ORDER BY performed_at, exercise_log_id
        """),
                {"u": user_id, "s": start, "e": end},
            )
            .scalars()
            .all()
        )
        items = [load_exercise_log(conn, i) for i in ids]
    return {"date": d.isoformat(), "timezone": tz, "items": items}
