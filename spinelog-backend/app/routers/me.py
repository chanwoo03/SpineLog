# =====================================================================
# routers/me.py : 내 정보 (온보딩에서 입력하는 질환·증상·목표·시간대)
# ---------------------------------------------------------------------
# 규칙 판정은 user_conditions(질환), user_symptoms(증상)를 읽는다.
# 지금까지는 SQL(마이그레이션 002)로 넣었는데, 이 API로 화면에서 넣을 수 있게 한다.
# 로그인 전이라 '나' = deps.get_current_user()가 돌려주는 시연 사용자
# =====================================================================
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user
from app.services.users import user_goals, user_timezone

router = APIRouter(prefix="/api", tags=["내 정보"])


# ---- 요청 양식 ----
class ConditionIn(BaseModel):
    condition_id: int
    disease_grade: int | None = Field(
        None, ge=1, le=5, description="질환 등급 (예: Meyerding 1~5). 없으면 비움"
    )
    goal_text: str | None = None


class SymptomIn(BaseModel):
    symptom_id: int
    severity_level: int | None = Field(
        None, ge=1, le=5, description="증상 정도 1~5. 없으면 비움"
    )


class GoalsIn(BaseModel):
    target_steps: int = Field(..., ge=0, le=100000, examples=[6000])
    target_sleep_minutes: int = Field(..., ge=0, le=1440, examples=[420])


class TimezoneIn(BaseModel):
    timezone: str = Field(..., examples=["Asia/Seoul"])


# ---------------------------------------------------------------------
# GET /api/profile-options : 온보딩 화면의 선택지 (질환 7개, 증상 8개)
# ---------------------------------------------------------------------
@router.get("/profile-options")
def profile_options():
    with engine.connect() as conn:
        conditions = (
            conn.execute(
                text("""
            SELECT condition_id, disease_name, description FROM conditions ORDER BY condition_id
        """)
            )
            .mappings()
            .all()
        )
        symptoms = (
            conn.execute(
                text("""
            SELECT symptom_id, symptom_name, description FROM symptoms ORDER BY symptom_id
        """)
            )
            .mappings()
            .all()
        )
    return {
        "conditions": [dict(r) for r in conditions],
        "symptoms": [dict(r) for r in symptoms],
    }


# ---------------------------------------------------------------------
# GET /api/me : 내 정보 한 번에 (시간대, 목표, 질환, 증상)
# ---------------------------------------------------------------------
def load_me(conn, user_id: str) -> dict:
    user = (
        conn.execute(
            text("""
        SELECT user_id, username, timezone FROM users WHERE user_id = :u
    """),
            {"u": user_id},
        )
        .mappings()
        .first()
    )
    if user is None:
        raise HTTPException(404, "사용자가 없습니다")
    conditions = (
        conn.execute(
            text("""
        SELECT uc.condition_id, c.disease_name, uc.disease_grade, uc.goal_text
        FROM user_conditions uc JOIN conditions c ON c.condition_id = uc.condition_id
        WHERE uc.user_id = :u ORDER BY uc.condition_id
    """),
            {"u": user_id},
        )
        .mappings()
        .all()
    )
    symptoms = (
        conn.execute(
            text("""
        SELECT us.symptom_id, s.symptom_name, us.severity_level
        FROM user_symptoms us JOIN symptoms s ON s.symptom_id = us.symptom_id
        WHERE us.user_id = :u ORDER BY us.symptom_id
    """),
            {"u": user_id},
        )
        .mappings()
        .all()
    )
    return {
        **dict(user),
        "goals": user_goals(conn, user_id),
        "conditions": [dict(r) for r in conditions],
        "symptoms": [dict(r) for r in symptoms],
    }


@router.get("/me")
def get_me(user_id: str = Depends(get_current_user)):
    with engine.connect() as conn:
        return load_me(conn, user_id)


# ---------------------------------------------------------------------
# PUT /api/me/conditions : 내 질환 목록을 통째로 바꿈
# ---------------------------------------------------------------------
# PUT = "이 내용으로 바꿔라". 기존 질환을 지우고 보낸 목록으로 다시 넣는다.
# 빈 목록 [] 을 보내면 질환이 모두 지워진다 (→ 판정은 NO_MATCH가 됨)
@router.put("/me/conditions")
def put_conditions(items: list[ConditionIn], user_id: str = Depends(get_current_user)):
    ids = [i.condition_id for i in items]
    if len(ids) != len(set(ids)):
        raise HTTPException(422, "같은 질환이 두 번 들어 있습니다")
    with engine.begin() as conn:  # 지우기 + 넣기가 함께 성공해야 하므로 트랜잭션
        user_timezone(conn, user_id)  # 사용자 확인 (없으면 404)
        for i in items:
            if (
                conn.execute(
                    text("SELECT 1 FROM conditions WHERE condition_id = :c"),
                    {"c": i.condition_id},
                ).first()
                is None
            ):
                raise HTTPException(422, f"없는 질환입니다: {i.condition_id}")
        conn.execute(
            text("DELETE FROM user_conditions WHERE user_id = :u"), {"u": user_id}
        )
        for i in items:
            conn.execute(
                text("""
                INSERT INTO user_conditions (user_id, condition_id, disease_grade, goal_text)
                VALUES (:u, :c, :g, :t)
            """),
                {
                    "u": user_id,
                    "c": i.condition_id,
                    "g": i.disease_grade,
                    "t": i.goal_text,
                },
            )
        return load_me(conn, user_id)


# ---------------------------------------------------------------------
# PUT /api/me/symptoms : 내 증상 목록을 통째로 바꿈
# ---------------------------------------------------------------------
@router.put("/me/symptoms")
def put_symptoms(items: list[SymptomIn], user_id: str = Depends(get_current_user)):
    ids = [i.symptom_id for i in items]
    if len(ids) != len(set(ids)):
        raise HTTPException(422, "같은 증상이 두 번 들어 있습니다")
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        for i in items:
            if (
                conn.execute(
                    text("SELECT 1 FROM symptoms WHERE symptom_id = :s"),
                    {"s": i.symptom_id},
                ).first()
                is None
            ):
                raise HTTPException(422, f"없는 증상입니다: {i.symptom_id}")
        conn.execute(
            text("DELETE FROM user_symptoms WHERE user_id = :u"), {"u": user_id}
        )
        for i in items:
            conn.execute(
                text("""
                INSERT INTO user_symptoms (user_id, symptom_id, severity_level) VALUES (:u, :s, :lv)
            """),
                {"u": user_id, "s": i.symptom_id, "lv": i.severity_level},
            )
        return load_me(conn, user_id)


# ---------------------------------------------------------------------
# PUT /api/me/goals : 목표 걸음 수·수면 시간 (대시보드에서 비교용)
# ---------------------------------------------------------------------
@router.put("/me/goals")
def put_goals(body: GoalsIn, user_id: str = Depends(get_current_user)):
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        # 있으면 고치고 없으면 새로 넣기 (user_goals는 사용자당 1행, PK = user_id)
        conn.execute(
            text("""
            INSERT INTO user_goals (user_id, target_steps, target_sleep_minutes)
            VALUES (:u, :st, :sl)
            ON DUPLICATE KEY UPDATE target_steps = VALUES(target_steps),
                                    target_sleep_minutes = VALUES(target_sleep_minutes)
        """),
            {"u": user_id, "st": body.target_steps, "sl": body.target_sleep_minutes},
        )
        return user_goals(conn, user_id)


# ---------------------------------------------------------------------
# PUT /api/me/timezone : 내 시간대 바꾸기 (예: 해외로 이동)
# ---------------------------------------------------------------------
# 지금까지는 가입할 때 기본값 'Asia/Seoul'로 한 번 들어가고 바꿀 방법이 없었다.
# 나중에 앱이 휴대폰의 시간대를 읽어서 이 API로 보내면 된다.
@router.put("/me/timezone")
def put_timezone(body: TimezoneIn, user_id: str = Depends(get_current_user)):
    try:
        ZoneInfo(body.timezone)  # 'Asia/Seoul'처럼 실제 있는 이름인지 검사
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(422, f"모르는 시간대입니다: {body.timezone}")
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        conn.execute(
            text("UPDATE users SET timezone = :tz WHERE user_id = :u"),
            {"tz": body.timezone, "u": user_id},
        )
    return {"user_id": user_id, "timezone": body.timezone}
