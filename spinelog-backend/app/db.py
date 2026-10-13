import os

from dotenv import load_dotenv # .env 파일을 읽는 도구 (python-dotenv)
from sqlalchemy import create_engine, event

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

@event.listens_for(engine, "connect")
def set_utc(dbapi_conn, connection_record):
    with dbapi_conn.cursor() as cur:
        cur.execute("SET time_zone = '+00:00'")