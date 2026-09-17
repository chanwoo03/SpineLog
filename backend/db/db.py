import os
# 운영체제(Windows)의 환경변수 같은 정보를 Python에서 가져올 수 있게 해준다.

from dotenv import load_dotenv
# load_dotenv()의 역할 .env 파일에 적어놓은 값을 Python이 사용할 수 있도록 불러오는 것.
# 예를 들어 .env가:
# DATABASE_URL=mysql+pymysql://root:1234@localhost:3306/spinelog라면 Python이 이 값을 읽을 수 있게 해준다.
from sqlalchemy import create_engine, text
# SQLAlchemy에서 두 가지 기능을 가져오는 거야.
# create_engine : 이건 쉽게 말해 데이터베이스에 연결할 수 있는 통로를 만든다라고 생각하면 된다.
# text : 이건 나중에 SQL 문장을 Python에서 실행할 때 사용한다.

load_dotenv()
# Python이 현재 프로젝트의 .env 파일을 찾아서 읽는다

DATABASE_URL = os.getenv("DATABASE_URL")
# Windows 환경에 저장되어 있는 DATABASE_URL이라는 값을 가져와라.

engine = create_engine(DATABASE_URL)
# 데이터베이스 연결에 필요한 엔진(engine)을 만든다.

# 쉽게 비유하면:
# DATABASE_URL
#      ↓
# create_engine()
#      ↓
# MySQL에 연결할 수 있는 통로
#      ↓
# engine

# 여기서 engine은 자동차 엔진이라는 뜻으로 생각하면 안 되고,
# Python이 데이터베이스와 통신하기 위한 연결 관리자 정도

def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print(result.fetchone())

test_connection()