# =====================================================================
# routers/auth.py : 회원가입 · 로그인
# ---------------------------------------------------------------------
# 비밀번호는 bcrypt 해시로만 저장 (services/passwords.py)
# 로그인에 성공하면 24시간짜리 JWT 토큰을 준다 (services/tokens.py)
# =====================================================================
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import engine
from app.services.passwords import hash_password, verify_password
from app.services.tokens import create_access_token

router = APIRouter(prefix="/api/auth", tags=["로그인"])


class SignupIn(BaseModel):
    """[요청] 회원가입"""

    user_id: str = Field(..., min_length=3, max_length=50, examples=["chanwoo"])
    email: str = Field(..., max_length=255, examples=["chanwoo@example.com"])
    password: str = Field(..., min_length=8, examples=["my-password-1"])
    username: str | None = Field(None, max_length=255, examples=["찬우"])  # 없으면 user_id


class LoginIn(BaseModel):
    """[요청] 로그인"""

    user_id: str = Field(..., examples=["chanwoo"])
    password: str = Field(..., examples=["my-password-1"])


# ---------------------------------------------------------------------
# POST /api/auth/signup : 회원가입
# ---------------------------------------------------------------------
@router.post("/signup", status_code=201)
def signup(body: SignupIn):
    with engine.begin() as conn:
        # 같은 아이디 "또는" 같은 이메일이 이미 있으면 거절
        exists = conn.execute(
            text("SELECT 1 FROM users WHERE user_id = :u OR email = :e"),
            {"u": body.user_id, "e": body.email},
        ).first()
        if exists:
            raise HTTPException(409, "이미 사용 중인 아이디 또는 이메일입니다")

        conn.execute(
            text("""
                INSERT INTO users (user_id, email, password_hash, username)
                VALUES (:u, :e, :h, :n)
            """),
            {
                "u": body.user_id,
                "e": body.email,
                "h": hash_password(body.password),  # 비밀번호 → 해시
                "n": body.username or body.user_id,
            },
        )
    return {"user_id": body.user_id, "message": "가입했습니다"}

# body는 화면(또는 Swagger)이 보낸 JSON 내용을 담아 둔 변수


# ---------------------------------------------------------------------
# POST /api/auth/login : 로그인 → 토큰 발급
# ---------------------------------------------------------------------
@router.post("/login")
def login(body: LoginIn):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT password_hash FROM users WHERE user_id = :u"),
            {"u": body.user_id},
        ).first()

    # 아이디가 없거나 비밀번호가 안 맞으면 → 똑같은 메시지로 거절
    # (어느 쪽이 틀렸는지 알려 주면 "있는 아이디"를 알아낼 수 있어서)
    if row is None or not verify_password(body.password, row[0]):
        raise HTTPException(401, "아이디 또는 비밀번호가 틀렸습니다")

    return {"access_token": create_access_token(body.user_id), "token_type": "bearer"}