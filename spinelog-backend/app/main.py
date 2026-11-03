from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from sqlalchemy import text

from app.db import engine
from app.routers import (
    activities,
    auth,
    checkins,
    contents,
    dashboard,
    exercise_logs,
    me,
    pain_logs,
)

app = FastAPI(title="SpineLog API")
app.include_router(pain_logs.router)
app.include_router(me.router)  # 내 정보 (질환·증상·목표·시간대)
app.include_router(checkins.router)  # 아침 체크인
app.include_router(activities.router)  # 활동 기록
app.include_router(exercise_logs.router)  # 운동 수행 기록
app.include_router(dashboard.router)  # 통증 7일 추이 · 대시보드
app.include_router(contents.router)  # 의학 콘텐츠 · 퀴즈
app.include_router(auth.router)     # 회원가입 . 로그인

# 시연용 테스트 화면: http://127.0.0.1:8000/demo
# 같은 서버에서 열리므로 화면이 /api/... 를 바로 부를 수 있다 (다른 주소면 CORS 설정이 필요)
DEMO_PAGE = Path(__file__).parent / "static" / "demo.html"


@app.get(
    "/demo", include_in_schema=False
)  # include_in_schema=False : Swagger 목록에는 안 보이게
def demo_page():
    return FileResponse(DEMO_PAGE)


@app.get("/api/api-check")  # GET /api/health 요청이 오면
def health():  # 이 함수를 실행해서
    return {"ok": True}  # 이 값을 돌려준다 (FastAPI가 JSON으로 바꿔 줌)


# def health():	요청이 왔을 때 실행할 함수예요. 이름은 자유지만 역할이 보이게 지어요
# return {"ok": True}	파이썬 dict를 돌려주면 FastAPI가 {"ok":true} JSON으로 바꿔서 응답해요


@app.get("/api/db-check")
def db_check():
    with engine.connect() as conn:  # 연결 하나를 빌린다 (블록이 끝나면 자동 반납)
        row = (
            conn.execute(
                text("""
            SELECT DATABASE()               AS db_name,
                   @@session.time_zone      AS time_zone,
                   NOW()                    AS db_now,
                   (SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = DATABASE()) AS table_count
                    """)
            )
            .mappings()
            .one()
        )  # 결과 1행을 {"컬럼명": 값} 형태로 꺼낸다
    return dict(row)  # dict로 바꿔서 JSON 응답
