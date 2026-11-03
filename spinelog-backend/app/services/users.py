# =====================================================================
# services/users.py : 여러 API가 같이 쓰는 사용자 도구
# =====================================================================
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.engine import Connection


def user_timezone(conn: Connection, user_id: str) -> str:
    """사용자의 시간대 이름 ('Asia/Seoul'). 사용자가 없으면 404.
    '오늘', '어제', '하루 범위'를 계산하는 API는 모두 이 값을 먼저 읽는다."""
    tz = conn.execute(
        text("SELECT timezone FROM users WHERE user_id = :u"), {"u": user_id}
    ).scalar()
    if tz is None:
        raise HTTPException(404, "사용자가 없습니다")
    return tz


def user_goals(conn: Connection, user_id: str) -> dict:
    """목표 걸음 수·수면 시간. 아직 저장한 적이 없으면 DB 기본값(6000보, 420분)과 같은 값을 돌려준다."""
    row = (
        conn.execute(
            text("""
        SELECT target_steps, target_sleep_minutes FROM user_goals WHERE user_id = :u
    """),
            {"u": user_id},
        )
        .mappings()
        .first()
    )
    if row is None:
        return {"target_steps": 6000, "target_sleep_minutes": 420, "is_default": True}
    return {**dict(row), "is_default": False}
