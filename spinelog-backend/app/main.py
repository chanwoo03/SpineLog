from fastapi import FastAPI
from sqlalchemy import text

from app.db import engine
from app.routers import pain_logs

app = FastAPI(title='SpineLog API')
app.include_router(pain_logs.router)

@app.get("/api/health")  # GET /api/health 요청이 오면
def health():            # 이 함수를 실행해서
    return {"ok": True}  # 이 값을 돌려준다 (FastAPI가 JSON으로 바꿔 줌)

# def health():	요청이 왔을 때 실행할 함수예요. 이름은 자유지만 역할이 보이게 지어요
# return {"ok": True}	파이썬 dict를 돌려주면 FastAPI가 {"ok":true} JSON으로 바꿔서 응답해요

@app.get("/api/db-check")
def db_check():
    with engine.connect() as conn:           # 연결 하나를 빌린다 (블록이 끝나면 자동 반납)
        row = conn.execute(text("""
            SELECT DATABASE()               AS db_name,
                   @@session.time_zone      AS time_zone,
                   NOW()                    AS db_now,
                   (SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = DATABASE()) AS table_count
                    """)).mappings().one()   # 결과 1행을 {"컬럼명": 값} 형태로 꺼낸다
    return dict(row)                         # dict로 바꿔서 JSON 응답