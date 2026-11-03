import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.tokens import read_token

# 요청 헤더의 "Authorization: Bearer <토큰>"을 꺼내 주는 도구
# (Swagger 오른쪽 위에 Authorize 버튼도 생김)
bearer = HTTPBearer(auto_error=False)


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str:
    """토큰을 읽어서 로그인한 사용자 ID를 돌려줌"""
    if cred is None:                      # 토큰을 안 보냄
        raise HTTPException(401, "로그인이 필요합니다")          # ①
    try:
        return read_token(cred.credentials)   # ② 토큰 → user_id 꺼내는 함수 (tokens.py에 있음)
    except jwt.InvalidTokenError:         # 서명 틀림·만료·엉터리 글자 전부
        raise HTTPException(401, "토큰이 잘못됐거나 만료됐습니다")