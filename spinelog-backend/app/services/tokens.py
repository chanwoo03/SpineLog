import os
from datetime import datetime, timedelta, timezone

import jwt

SECRET = os.environ["JWT_SECRET"]
ALGORITHM = "HS256"
EXPIRE = timedelta(hours=24)

def create_access_token(user_id: str) -> str:
    """로그인 성공 때: user_id를 담은 토큰(손목 밴드) 만들기"""
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + EXPIRE}
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def read_token(token: str) -> str:
    """요청이 올 때: 토큰이 진짜인지·기한이 남았는지 확인하고 user_id 꺼내기"""
    payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    return payload["sub"]