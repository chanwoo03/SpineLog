from datetime import datetime

from pydantic import BaseModel, Field


class PainLogCreate(BaseModel):
    """[요청] 화면이 보내는 값 3개. user_id와 시각은 서버가 정한다."""
    # ge=0, le=10 : 0 이상 10 이하. 11을 보내면 422
    pain_score: int = Field(..., ge=0, le=10, examples=[6])
    pain_location_id: int = Field(..., examples=[1])   # 1 = 허리 중앙
    pain_type_id: int = Field(..., examples=[2])       # 2 = 저릿한


class PainLogSaved(BaseModel):
    """[응답] 저장 결과 (API-3에서 판정 결과가 추가됨)"""
    log_id: int
    recorded_at: datetime     # UTC, 응답에서는 ...Z 형태
    pain_score: int