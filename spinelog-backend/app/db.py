import os

from dotenv import load_dotenv  # .env 파일을 읽는 도구 (python-dotenv)
from sqlalchemy import create_engine, event

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
# .env 파일의 DATABASE_URL=... 줄을 읽어 환경변수로 올립니다.

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
# 엔진 = 연결 풀(pool) 관리자입니다.
# DB 연결을 매번 새로 맺으면 느리기 때문에, 엔진이 연결 몇 개를 만들어 두고 요청마다 빌려주고 돌려받습니다.


@event.listens_for(engine, "connect")
def set_utc(dbapi_conn, connection_record):
    with dbapi_conn.cursor() as cur:
        cur.execute("SET time_zone = '+00:00'")


# "이 엔진이 DB와 새 연결을 맺을 때마다 바로 아래 함수를 실행해라"라는 등록입니다.
# @app.get과 같은 원리입니다. 등록만 하고, 실행은 그 일이 생길 때 합니다.
