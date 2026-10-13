# =====================================================================
# schemas.py : API가 주고받는 데이터의 "모양(양식)"
# ---------------------------------------------------------------------
# Pydantic BaseModel을 상속하면 FastAPI가 자동으로
#   1) 요청 JSON이 이 모양과 맞는지 검사 (틀리면 함수 실행 전에 422)
#   2) Swagger(/docs)에 입력 예시를 보여 줌
# =====================================================================

from datetime import datetime

from pydantic import BaseModel, Field


class PainLogCreate(BaseModel):
    """[요청] POST /api/pain-logs 로 화면이 보내는 값 3개

    user_id와 시각은 받지 않는다.
      user_id     : 서버가 로그인 정보로 정함 (deps.get_current_user)
      recorded_at : '지금' 기록이므로 서버가 UTC로 정함
    """
    # ge=0, le=10 : 0 이상 10 이하. 11을 보내면 422
    pain_score: int = Field(..., ge=0, le=10, examples=[6])
    pain_location_id: int = Field(..., examples=[1])   # 1 = 허리 중앙
    pain_type_id: int = Field(..., examples=[2])       # 2 = 저릿한




# ---- 아래는 API-3에서 추가 : 판정 결과 응답 ----

class GuideItem(BaseModel):
    """운동 하나의 판정 (pain_log_guide 1행)"""
    guide_id: int
    exercise_id: int
    exercise_name: str
    level_code: str            # RECOMMENDED / CAUTION / CONTRAINDICATED (화면 색 구분용)
    level_label: str | None    # 추천 / 주의 / 금기
    message: str | None        # 판정 '당시' 안내 문구
    rule_id: int | None        # 이 판정을 만든 규칙 → "왜?" 추적


class PainLogDetail(BaseModel):
    """통증 기록 1건 + 당시 판정. POST 응답과 상세 조회(API-4)가 같은 모양"""
    log_id: int
    recorded_at: datetime
    pain_score: int
    severity_label: str | None
    action_guide: str | None
    pain_location_name: str | None
    pain_type_name: str | None
    assessment_status: str | None       # COMPLETED / PARTIAL / NO_MATCH / null(예전 기록)
    missing_context: list[str] | None   # 예) ["MORNING_CHECKIN"]
    guides: list[GuideItem]             # 금기 → 주의 → 추천 순서
    basic_guide: str | None = None      # NO_MATCH일 때만 기본 안내
