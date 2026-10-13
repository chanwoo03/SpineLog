from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user
from app.schemas import PainLogCreate, PainLogSaved
from app.timeutil import as_utc, utc_now

# prefix="/api" : 이 파일의 모든 주소 앞에 /api가 자동으로 붙음
# tags          : Swagger(/docs)에서 "통증 기록"이라는 묶음으로 보이게
router = APIRouter(prefix="/api", tags=["통증 기록"])


@router.get("/pain-options")
def pain_options():
    """통증 기록 화면에 띄울 선택지: 위치, 유형, 0~10점 설명"""

    # 조회만 하므로 engine.connect() (저장할 때는 engine.begin()을 씀 → API-2)
    with engine.connect() as conn:
        # 1) 통증 위치 (part_of_location_id = 상위 부위, PART-OF 관계)
        locations = conn.execute(text("""
            SELECT location_id, location_name, part_of_location_id
            FROM pain_locations
            ORDER BY location_id
        """)).mappings().all()

        # 2) 통증 유형
        types = conn.execute(text("""
            SELECT pain_type_id, pain_type_name
            FROM pain_types
            ORDER BY pain_type_id
        """)).mappings().all()

        # 3) 점수 0~10 설명 + 심각도 (두 테이블 JOIN)
        scale = conn.execute(text("""
            SELECT d.pain_score, d.level_name, d.action_guide,
                   c.severity_label, c.nrs_range
            FROM pain_scale_dictionary d
            JOIN pain_severity_categories c ON c.severity_id = d.severity_id
            ORDER BY d.pain_score
        """)).mappings().all()

    # 행 목록을 dict 목록으로 바꿔서 JSON 응답
    return {
        "locations": [dict(r) for r in locations],
        "types": [dict(r) for r in types],
        "scale": [dict(r) for r in scale],
    }

# status_code=201 : "새로 만들어졌다(Created)". 단순 성공 200과 구분
@router.post("/pain-logs", response_model=PainLogSaved, status_code=201)
def create_pain_log(body: PainLogCreate, user_id: str = Depends(get_current_user)):
    # engine.begin() : 트랜잭션. 블록 안이 전부 성공하면 확정, 중간에 에러가 나면 전부 취소
    with engine.begin() as conn:
        # 1. 사용자 확인 → 없으면 404
        if conn.execute(text("SELECT 1 FROM users WHERE user_id = :u"),
                        {"u": user_id}).first() is None:
            raise HTTPException(404, "사용자가 없습니다")

        # 2. 위치·유형이 있는지 → 없으면 422 (확인 안 하면 FK 에러가 500으로 보임)
        if conn.execute(text("SELECT 1 FROM pain_locations WHERE location_id = :x"),
                        {"x": body.pain_location_id}).first() is None:
            raise HTTPException(422, "없는 통증 위치입니다")
        if conn.execute(text("SELECT 1 FROM pain_types WHERE pain_type_id = :x"),
                        {"x": body.pain_type_id}).first() is None:
            raise HTTPException(422, "없는 통증 유형입니다")

        # 3. 저장. :u 같은 자리표시자로 값을 따로 넘김 → SQL 인젝션 방지
        now = utc_now()
        res = conn.execute(text("""
            INSERT INTO pain_logs (user_id, pain_location_id, pain_type_id, pain_score, recorded_at)
            VALUES (:u, :loc, :typ, :score, :at)
        """), {"u": user_id, "loc": body.pain_location_id, "typ": body.pain_type_id,
               "score": body.pain_score, "at": now})
        log_id = res.lastrowid      # 방금 자동 생성된 log_id

    return PainLogSaved(log_id=log_id, recorded_at=as_utc(now), pain_score=body.pain_score)