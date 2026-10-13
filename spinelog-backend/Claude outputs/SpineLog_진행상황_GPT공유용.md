# SpineLog 진행 상황 공유 (2026-10-13)

> ChatGPT에 붙여 넣어 검토받기 위한 정리본입니다. 비밀번호 값은 빼고 형식만 적었습니다.
> 맨 아래 "검토 요청"까지 함께 붙여 넣으면 됩니다.

## 0. 프로젝트 요약

- 서비스: SpineLog(SpineWell). 척추 질환자의 통증·활동·수면 기록을 바탕으로, DB에 넣은 규칙(LLM 아님)으로 운동을 권장/주의/금지로 판정
- 스택: FastAPI + SQLAlchemy(text SQL) + PyMySQL, MySQL 8.0(3NF, 33개 테이블), React(예정), 시놀로지 NAS + Docker
- 개발 환경: Windows, Python 3.14, VS Code
- 시간 원칙: DB 저장은 UTC(세션 `time_zone='+00:00'`), "오늘"은 `users.timezone`(IANA, 기본 Asia/Seoul) 기준으로 계산

## 1. 오늘 한 일 요약

완성 코드를 받아 실행만 하다 보니 설명을 못 해서, **백엔드를 처음부터 한 단계씩 다시 만드는 중**입니다. 예전 코드는 `spinelog-backend-old`로 백업했습니다.

| 단계 | 만든 것 | 상태 |
|---|---|---|
| 1. 가장 작은 서버 | venv, `app/main.py`, `GET /api/health` | 완료 (내 PC에서 확인) |
| 2. DB 연결 | `.env`, `app/db.py`(UTC 고정), `GET /api/db-check` | 완료 (내 PC에서 확인) |
| 3. DB 내보내기 | `deploy/db-init/spinelog.sql` (Workbench, Structure and Data, 파일 1개) | 완료 |
| 4. 컨테이너 설명서 | `Dockerfile`, `.dockerignore`, `requirements.txt` | 작성만 (아직 빌드 안 해 봄) |
| 5. 배포 설계도 | `compose.yaml`, `deploy/db.env`, `deploy/api.env` | 작성만 (YAML 문법 확인) |
| 6. NAS 업로드 | File Station으로 `docker/spinelog`에 업로드 | 완료 |
| 7. NAS 실행 | Container Manager 프로젝트 | 결과 확인 전 |

내 PC의 `/api/db-check` 결과:

```json
{"db_name": "spinelog", "time_zone": "+00:00", "db_now": "2026-10-13T10:25:33", "table_count": 33}
```

## 2. 현재 폴더 구조

```
spinelog-backend/
  app/
    __init__.py
    main.py          GET /api/health, GET /api/db-check
    db.py            .env → create_engine, 연결 시 SET time_zone='+00:00'
  deploy/
    db-init/spinelog.sql   NAS MySQL 첫 실행 때 자동으로 읽는 초기 SQL
    db.env                 NAS MySQL용 (root 비번, DB명, 앱 계정)
    api.env                NAS api용 (DATABASE_URL)
  .env               내 PC용 DATABASE_URL (127.0.0.1)
  .gitignore         .env, venv/, __pycache__/, deploy/db-init/*.sql, deploy/*.env
  .dockerignore      .env, venv/, __pycache__/, deploy/
  Dockerfile
  compose.yaml
  requirements.txt   fastapi, uvicorn, sqlalchemy, pymysql, python-dotenv, cryptography
```

## 3. 핵심 코드

**app/db.py**

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, event

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

@event.listens_for(engine, "connect")
def set_utc(dbapi_conn, connection_record):
    with dbapi_conn.cursor() as cur:
        cur.execute("SET time_zone = '+00:00'")
```

**app/main.py**

```python
from fastapi import FastAPI
from sqlalchemy import text
from app.db import engine

app = FastAPI(title='SpineLog API')

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/db-check")
def db_check():
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT DATABASE() AS db_name, @@session.time_zone AS time_zone, NOW() AS db_now,
                   (SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = DATABASE()) AS table_count
        """)).mappings().one()
    return dict(row)
```

**Dockerfile**

```dockerfile
FROM python:3.14-slim
WORKDIR /code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**compose.yaml** (주석은 빼고 옮김)

```yaml
services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    env_file: ./deploy/db.env
    volumes:
      - ./deploy/db-init:/docker-entrypoint-initdb.d:ro
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -uroot -p$$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 60s

  api:
    build: .
    restart: unless-stopped
    env_file: ./deploy/api.env
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  mysql-data:
```

**deploy/db.env / api.env 형식** (값은 가림)

```
# db.env
MYSQL_ROOT_PASSWORD=****
MYSQL_DATABASE=spinelog
MYSQL_USER=spinelog_app
MYSQL_PASSWORD=****          (root와 다른 값)

# api.env
DATABASE_URL=mysql+pymysql://spinelog_app:****@db:3306/spinelog?charset=utf8mb4
                              (MYSQL_PASSWORD와 같은 값)
```

## 4. 설계 결정과 이유

| 결정 | 이유 |
|---|---|
| NAS 컨테이너 2개 (db=공식 mysql:8.0 이미지, api=Dockerfile로 빌드) | MySQL은 받아 쓰고 내 코드만 직접 빌드 |
| api는 `db:3306`으로 접속 | 컨테이너 안의 localhost는 컨테이너 자기 자신이라, compose 서비스 이름으로 찾음 |
| api에만 `ports`, db는 외부 비공개 | DB는 API를 거쳐서만 접근하게 함 |
| healthcheck + depends_on | MySQL이 초기 SQL을 읽는 동안 api가 먼저 켜져 접속 실패하는 것을 막음 |
| named volume `mysql-data` | 컨테이너를 다시 만들어도 데이터 유지 |
| db.env / api.env 분리, 앱 전용 계정 | 최소 권한. api는 root 비번을 모름 |
| 초기 SQL은 첫 실행 1회만 | 이후 구조 변경은 번호 붙인 마이그레이션 SQL로 개발·운영 DB 양쪽에 적용할 계획 |
| requirements에 cryptography | 새 MySQL 8의 caching_sha2_password 첫 인증에 PyMySQL이 필요로 함 |

## 5. DB 상태 메모

- 적용됨: `pain_logs.pain_score` TINYINT + FK(점수 사전) + 0~10 CHECK, `users.timezone`, `morning_checkins` UNIQUE(user_id, checkin_date)
- 아직 미적용(계획): `pain_logs.assessment_status`, `missing_context`(JSON), `pain_log_guide` UNIQUE(log_id, exercise_id) + `guide_message`, 규칙 범위 CHECK
- 데이터: users 4, conditions 7, exercises 12, exercise_guide_rules 19, pain_locations 17. `user_conditions`는 비어 있음
- 테이블 문자셋이 utf8mb3 (한글 OK, 이모지 불가). 나중에 utf8mb4로 바꿀 예정

## 6. 다음 계획

1. NAS 실행 결과 확인 → 집 안에서 `http://NAS내부IP:8000/api/db-check`
2. DDNS(synology.me) + Let's Encrypt HTTPS + DSM 리버스 프록시(443 → localhost:8000)
3. 공유기에서 443만 NAS로 포트포워딩 (DSM 5000/5001, MySQL 3306은 열지 않음)
4. 휴대폰 LTE로 외부 접속 확인
5. 통증 기록 API 옮기기: `GET /api/pain-options`, `POST /api/pain-logs`(저장 + 규칙 판정 + 판정 상태, 201), `GET /api/pain-logs?date=`, `GET /api/pain-logs/{log_id}`
6. VS Code 디버거로 흐름 추적, 간단한 화면(또는 Swagger 시연)

---

## 검토 요청 (ChatGPT에 같이 붙여 넣기)

> 위는 내 프로젝트 SpineLog의 오늘 진행 상황이야. 아래를 검토해 줘.
> 1. compose.yaml과 Dockerfile에서 시놀로지 Container Manager로 실행할 때 문제가 될 만한 부분
> 2. 보안상 빠진 것 (특히 외부 공개 전에 꼭 해야 할 것)
> 3. 초기 SQL(첫 실행 1회) + 이후 마이그레이션 SQL로 관리하는 방식의 허점
> 4. 다음 계획의 순서가 적절한지
> 확실하지 않은 건 확실하지 않다고 말해 주고, 근거를 붙여 줘.
