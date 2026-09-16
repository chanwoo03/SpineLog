from db import engine
from sqlalchemy import text

with engine.connect() as connection:
    connection.execute(
        text("""
            INSERT INTO users (email, password_hash)
            VALUES (:email, :password_hash)
        """),
        {
            "email": "test@test.com",
            "password_hash": "1234"
        }
        # :email이라고 쓰냐?

        # 이 부분이 중요하다.
        # text("""
        #     INSERT INTO users (email, password_hash)
        #     VALUES (:email, :password_hash)
        # """)

        # 그리고:

        # {
        #     "email": "test@test.com",
        #     "password_hash": "1234"
        # }

        # 이렇게 따로 값을 전달한다.

        # 즉: SQL 문장
        #     ↓
        # :email
        #     ↓
        # Python이 실제 이메일 전달

        # 사용자가 입력한 값을 SQL 문자열에 직접 이어 붙이는 방식은 피해야 한다.
        # SQL Injection 같은 보안 문제가 생길 수 있기 때문이다.
    )

    connection.commit()