from fastapi import FastAPI, HTTPException, status
# FastAPI: 회원가입 같은 API를 만드는 도구
# HTTPException: “이메일이 이미 있어요” 같은 오류 응답을 보내는 도구
# status: 201, 409 같은 응답 번호를 읽기 쉽게 쓰는 도구
from pydantic import BaseModel, EmailStr, Field
# BaseModel: “회원가입 정보는 이런 모양이어야 해”라고 정하는 틀
# EmailStr: 이메일이 abc@example.com 같은 올바른 형태인지 확인
# Field: 글자 수 같은 추가 규칙을 설정
from pwdlib import PasswordHash
# 비밀번호를 안전한 해시값으로 바꾸는 도구야. 원래 비밀번호를 DB에 넣지 않기 위해 필요해.
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
# text: Python에서 SQL 문장을 실행할 수 있게 해줘.
# IntegrityError: 이미 있는 이메일처럼 DB 규칙을 어기는 저장 요청에서 발생하는 오류야.

from db import engine


app = FastAPI()
# 회원가입 API를 담을 FastAPI 앱을 만드는 줄이야. 이제부터 app에 기능을 추가한다
password_hasher = PasswordHash.recommended()
# 비밀번호를 해시 처리할 도구를 준비하는 줄이야. 
# recommended()는 현재 권장되는 안전한 방식을 사용한다는 뜻


class SignupRequest(BaseModel):
    # 회원가입할 때 사용자가 보내야 하는 정보의 규칙을 만드는 부분이야.
    # SignupRequest는 “회원가입 요청”이라는 뜻의 이름일 뿐
    user_id: str = Field(min_length=1, max_length=50)
        # user_id: str -> user_id에는 글자(str)가 들어와야 한다라는 뜻
        # user_id를 반드시 받아야 해.
        # str은 글자라는 뜻이야.
        # 1글자 이상, 50글자 이하만 허용해.
        # 이는 DB의 user_id varchar(50) 규칙에 맞춘 거야.
    
    username : str = Field(min_length=1, max_length=255)

    email: EmailStr
    # - email을 반드시 받아야 해.
    # - 이메일 모양이 맞는지 자동 확인해.
    # - 예: test@naver.com은 통과, hello는 거절.
    password: str = Field(min_length=8)
    # 비밀번호를 반드시 받아야 해.
    # 최소 8글자로 제한해.
    # 이 비밀번호는 잠시 Python에만 들어오고, 바로 해시 처리할 거야.

    

@app.post("/users", status_code=status.HTTP_201_CREATED)
# 사용자가 POST /users 주소로 회원가입 정보를 보내면, 바로 아래의 signup 함수를 실행하라는 뜻
def signup(data: SignupRequest):
    # - 사용자가 보낸 user_id, email, password가 data에 들어와.
    # - 그 정보가 앞에서 만든 SignupRequest 규칙을 통과해야만 여기까지 올 수 있어.   
    hashed_password = password_hasher.hash(data.password)
    # 사용자가 입력한 원래 비밀번호를 해시값으로 바꿔.
    try:
        with engine.begin() as connection:
            # connection: 실제 DB와 대화하는 연결
            # begin(): 아래 작업이 정상 완료되면 저장하고, 오류가 나면 취소하는 안전장치/ “저장 작업 묶음 시작” 정도
            existing_user = connection.execute(
                # DB에 SQL을 실행해서, 같은 ID 또는 이메일이 이미 있는지 확인하는 부분
                text("""
                    SELECT user_id
                    FROM users
                    WHERE user_id = :user_id OR email = :email
                """),
                {
                    "user_id": data.user_id,
                    "email": data.email,
                },
            ).first()
            # SQL 안의 :email 자리에, 사용자가 입력한 email 값을 넣어줘.
            # 예를 들어 사용자가 이렇게 가입하려고 한다고 해보자.
            # {
            # "user_id": "minji",
            # "email": "minji@example.com",
            # "password": "mypassword123"
            # }
            # 그러면 Python은 아래처럼 연결해 줘.
            # SQL의 :user_id  →  "minji"
            # SQL의 :email    →  "minji@example.com"
            # 실제로 DB에는 이런 의미의 검색 요청이 전달돼.
            # SELECT user_id
            # FROM users
            # WHERE user_id = 'minji' OR email = 'minji@example.com';
            # 다만 Python에서 직접 SQL 문장에 값을 붙여 쓰지 않고 { }로 따로 전달하는 이유는 안전 때문이야. 
            # 이상한 입력으로 SQL이 망가지거나 악용되는 것을 막아줘. 그리고:
            # ).first()
            # 는 SQL 검색 결과 중에서 첫 번째 한 건만 가져와라는 뜻이야.

            if existing_user:
                raise HTTPException(
                    # 회원가입을 멈추고 사용자에게 오류를 알려줘.
                    # - 409 Conflict: 이미 존재하는 정보와 충돌한다는 뜻
                    # - detail: Swagger 화면 등에 표시할 오류 문구
                    status_code=status.HTTP_409_CONFLICT,
                    detail="이미 사용 중인 사용자 ID 또는 이메일입니다.",
                )

            connection.execute(
                text("""
                    INSERT INTO users (user_id, username, email, password_hash)
                    VALUES (:user_id, :username, :email, :password_hash)
                """),
                {
                    "user_id": data.user_id,
                    "username" : data.username,
                    "email": data.email,
                    "password_hash": hashed_password,
                },
            )

        return {
            "message": "회원가입이 완료되었습니다.",
            "user_id": data.user_id,
            "username": data.username,
            "email": data.email,
        }

    except IntegrityError:
        # IntegrityError: 이미 있는 이메일처럼 DB 규칙을 어기는 저장 요청에서 발생하는 오류야.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 사용자 ID 또는 이메일입니다.",
        )

    # 입력 받기 → 형식 검사 → 비밀번호 해시 → 중복 확인 → DB 저장 → 성공 응답

class LoginRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=50)
    password: str


@app.post("/login")
def login(data: LoginRequest):
    with engine.connect() as connection:
        user = connection.execute(
            text("""
                SELECT user_id, email, username, password_hash
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": data.user_id},
        ).mappings().first()

    if user is None or not password_hasher.verify(
        data.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자 ID 또는 비밀번호가 올바르지 않습니다.",
        )

    return {
        "message": "로그인에 성공했습니다.",
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"],
    }

@app.get("/symptoms")
def get_symptoms():
    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT symptom_id, symptom_name, description
                FROM symptoms
                ORDER BY symptom_id
            """)
        ).mappings().all()

    return [
        {
            "symptom_id": row["symptom_id"],
            "symptom_name": row["symptom_name"],
            "description": row["description"],
        }
        for row in rows
    ]

class SymptomSelectionRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=50)
    symptom_ids: list[int] = Field(min_length=1)
    severity_level: int = Field(ge=1, le=5)  # 추가: 증상 심각도 (1~5 등급 등, DB tinyint 기준)


@app.post("/user-symptoms", status_code=status.HTTP_201_CREATED)
def save_user_symptoms(data: SymptomSelectionRequest):
    if len(data.symptom_ids) != len(set(data.symptom_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="같은 증상을 중복으로 선택할 수 없습니다.",
        )

    with engine.begin() as connection:
        user = connection.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": data.user_id},
        ).first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다.",
            )

        for symptom_id in data.symptom_ids:
            symptom = connection.execute(
                text("""
                    SELECT symptom_id
                    FROM symptoms
                    WHERE symptom_id = :symptom_id
                """),
                {"symptom_id": symptom_id},
            ).first()

            if symptom is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"존재하지 않는 증상 번호입니다: {symptom_id}",
                )

            for symptom_id in data.symptom_ids:
                connection.execute(
                    text("""
                        INSERT INTO user_symptoms (user_id, symptom_id, severity_level)
                        VALUES (:user_id, :symptom_id, :severity_level)
                    """),
                    {
                        "user_id": data.user_id,
                        "symptom_id": symptom_id,
                        "severity_level": data.severity_level,
                    },
                )
    return {
        "message": "증상 정보가 저장되었습니다.",
        "user_id": data.user_id,
        "symptom_ids": data.symptom_ids,
    }

@app.get("/users/{user_id}/onboarding-status")
def get_onboarding_status(user_id: str):
    with engine.connect() as connection:
        user = connection.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": user_id},
        ).first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다.",
            )

        saved_symptom = connection.execute(
            text("""
                SELECT 1
                FROM user_symptoms
                WHERE user_id = :user_id
                LIMIT 1
            """),
            {"user_id": user_id},
        ).first()

    return {
        "user_id": user_id,
        "onboarding_completed": saved_symptom is not None,
    }

class PainLogRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=50)
    pain_score: int = Field(ge=0, le=10)
    pain_location_id: int
    pain_type_id: int


@app.post("/pain-logs", status_code=status.HTTP_201_CREATED)
def create_pain_log(data: PainLogRequest):
    with engine.begin() as connection:
        user = connection.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": data.user_id},
        ).first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다.",
            )

        location = connection.execute(
            text("""
                SELECT location_id
                FROM pain_locations
                WHERE location_id = :location_id
            """),
            {"location_id": data.pain_location_id},
        ).first()

        if location is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="존재하지 않는 통증 위치입니다.",
            )

        pain_type = connection.execute(
            text("""
                SELECT pain_type_id
                FROM pain_types
                WHERE pain_type_id = :pain_type_id
            """),
            {"pain_type_id": data.pain_type_id},
        ).first()

        if pain_type is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="존재하지 않는 통증 종류입니다.",
            )

        result = connection.execute(
            text("""
                INSERT INTO pain_logs (
                    user_id,
                    pain_score,
                    pain_location_id,
                    pain_type_id
                )
                VALUES (
                    :user_id,
                    :pain_score,
                    :pain_location_id,
                    :pain_type_id
                )
            """),
            {
                "user_id": data.user_id,
                "pain_score": data.pain_score,
                "pain_location_id": data.pain_location_id,
                "pain_type_id": data.pain_type_id,
            },
        )

    return {
        "message": "통증 기록이 저장되었습니다.",
        "log_id": result.lastrowid,
    }

@app.get("/pain-locations")
def get_pain_locations():
    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT location_id, location_name
                FROM pain_locations
                ORDER BY location_id
            """)
        ).mappings().all()

    return [
        {
            "location_id": row["location_id"],
            "location_name": row["location_name"],
        }
        for row in rows
    ]


@app.get("/pain-types")
def get_pain_types():
    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT pain_type_id, pain_type_name
                FROM pain_types
                ORDER BY pain_type_id
            """)
        ).mappings().all()

    return [
        {
            "pain_type_id": row["pain_type_id"],
            "pain_type_name": row["pain_type_name"],
        }
        for row in rows
    ]

@app.get("/users/{user_id}/pain-logs")
def get_pain_logs(user_id: str):
    with engine.connect() as connection:
        user = connection.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": user_id},
        ).first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다.",
            )

        rows = connection.execute(
            text("""
                SELECT
                    pl.log_id,
                    pl.pain_score,
                    pl.recorded_at,
                    loc.location_name,
                    typ.pain_type_name
                FROM pain_logs AS pl
                JOIN pain_locations AS loc
                    ON pl.pain_location_id = loc.location_id
                JOIN pain_types AS typ
                    ON pl.pain_type_id = typ.pain_type_id
                WHERE pl.user_id = :user_id
                ORDER BY pl.recorded_at DESC, pl.log_id DESC
            """),
            {"user_id": user_id},
        ).mappings().all()

    return [
        {
            "log_id": row["log_id"],
            "pain_score": row["pain_score"],
            "recorded_at": row["recorded_at"],
            "pain_location": row["location_name"],
            "pain_type": row["pain_type_name"],
        }
        for row in rows
    ]

class MedicalContentResponse(BaseModel):
    content_id: int
    title: str
    summary: str | None
    category_id: int
    condition_id: int | None
    source_url: str | None


@app.get("/medical-contents")
def get_medical_contents(condition_id: int | None = None):
    with engine.connect() as connection:
        if condition_id is not None:
            rows = connection.execute(
                text("""
                    SELECT content_id, title, summary, category_id, condition_id, source_url
                    FROM medical_contents
                    WHERE condition_id = :condition_id
                    ORDER BY created_at DESC
                """),
                {"condition_id": condition_id},
            ).mappings().all()
        else:
            rows = connection.execute(
                text("""
                    SELECT content_id, title, summary, category_id, condition_id, source_url
                    FROM medical_contents
                    ORDER BY created_at DESC
                """)
            ).mappings().all()

    return [dict(row) for row in rows]


@app.get("/medical-contents/{content_id}")
def get_medical_content_detail(content_id: int):
    with engine.connect() as connection:
        row = connection.execute(
            text("""
                SELECT content_id, title, summary, body, category_id, condition_id, source_url
                FROM medical_contents
                WHERE content_id = :content_id
            """),
            {"content_id": content_id},
        ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 콘텐츠입니다.",
        )

    return dict(row)

class ExerciseRecommendation(BaseModel):
    exercise_id: int
    exercise_name: str
    difficulty: int
    caution: str | None
    message: str | None


@app.get("/users/{user_id}/exercise-recommendations")
def get_exercise_recommendations(user_id: str):
    with engine.connect() as connection:
        user = connection.execute(
            text("SELECT user_id FROM users WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).first()
        if user is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다.")

        # 1. 최근 통증 점수
        latest_pain = connection.execute(
            text("""
                SELECT pain_score FROM pain_logs
                WHERE user_id = :user_id
                ORDER BY recorded_at DESC LIMIT 1
            """),
            {"user_id": user_id},
        ).first()
        pain_score = latest_pain[0] if latest_pain else 0

        # 2. 사용자의 질환/증상 ID 목록
        condition_ids = [r[0] for r in connection.execute(
            text("SELECT condition_id FROM patient_conditions WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).all()]
        symptom_ids = [r[0] for r in connection.execute(
            text("SELECT symptom_id FROM user_symptoms WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).all()]

        if not condition_ids and not symptom_ids:
            return {"recommended": [], "avoid": [], "message": "등록된 질환/증상이 없어 추천할 수 없습니다."}

        # 3. 사용자의 평균 체감 난이도 (기록 없으면 기본값 2 = 쉬운 편부터)
        avg_difficulty = connection.execute(
            text("""
                SELECT AVG(perceived_difficulty) FROM user_exercise_logs
                WHERE user_id = :user_id
            """),
            {"user_id": user_id},
        ).scalar()
        target_difficulty = round(avg_difficulty) if avg_difficulty else 2

        # 4. 규칙에 맞는 운동 조회 (통증 점수 범위 + 질환/증상 매칭)
        rules = connection.execute(
            text("""
                SELECT er.recommendation_level, er.message,
                       e.exercise_id, e.exercise_name, e.difficulty, e.caution
                FROM exercise_rules er
                JOIN exercises e ON er.exercise_id = e.exercise_id
                WHERE :pain_score BETWEEN er.min_pain_score AND er.max_pain_score
                  AND (er.condition_id IN :condition_ids OR er.symptom_id IN :symptom_ids)
            """).bindparams(
                bindparam("condition_ids", expanding=True),
                bindparam("symptom_ids", expanding=True),
            ),
            {
                "pain_score": pain_score,
                "condition_ids": condition_ids or [-1],
                "symptom_ids": symptom_ids or [-1],
            },
        ).mappings().all()

    recommended = [r for r in rules if r["recommendation_level"] > 0]
    avoid = [r for r in rules if r["recommendation_level"] == 0]

    # 목표 난이도에 가까운 순으로 정렬
    recommended = sorted(recommended, key=lambda r: abs(r["difficulty"] - target_difficulty))

    return {
        "recommended": [
            {"exercise_id": r["exercise_id"], "exercise_name": r["exercise_name"],
             "difficulty": r["difficulty"], "message": r["message"]}
            for r in recommended
        ],
        "avoid": [
            {"exercise_id": r["exercise_id"], "exercise_name": r["exercise_name"],
             "caution": r["caution"], "message": r["message"]}
            for r in avoid
        ],
        "target_difficulty": target_difficulty,
    }