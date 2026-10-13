# =====================================================================
# routers/pain_logs.py : 통증 기록 관련 API를 모아 두는 파일
# ---------------------------------------------------------------------
# 라우터(router) = "이 주소로 요청이 오면 이 함수를 실행해라"를 모아 둔 묶음
# main.py에 다 쓰지 않고 기능별 파일로 나누는 이유:
#   기능이 늘어나도(체크인, 활동 기록...) 파일만 추가하면 되고, 찾기 쉬움
# =====================================================================

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user           # [임시] 로그인 사용자
from sqlalchemy.engine import Connection
from app.schemas import GuideItem, PainLogCreate, PainLogDetail  # 요청·응답 양식
from app.services import rule_engine             # 규칙 엔진
from app.timeutil import as_utc, utc_now         # UTC 시간 도구

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

    # .mappings().all() 결과는 dict처럼 생긴 행 목록 → dict로 바꿔서 JSON 응답
    return {
        "locations": [dict(r) for r in locations],
        "types": [dict(r) for r in types],
        "scale": [dict(r) for r in scale],
    }


# ---------------------------------------------------------------------
# 공통: 저장된 기록 1건 + 당시 판정을 DB에서 읽기 (POST 응답, 상세 조회가 같이 씀)
# ---------------------------------------------------------------------
BASIC_GUIDE = "맞는 규칙이 없습니다. 가벼운 걷기를 하고, 통증이 계속되면 전문의와 상담하세요."


def load_detail(conn: Connection, log_id: int, user_id: str) -> PainLogDetail | None:
    """WHERE ... AND p.user_id = :u → 본인 기록만. 남의 기록이면 None (라우터에서 404)
    저장 직후에도 이 함수로 'DB에 저장된 값'을 다시 읽어서 응답한다.
    → 화면에 보인 결과 = DB에 남은 결과"""
    row = conn.execute(text("""
        SELECT p.log_id, p.recorded_at, p.pain_score, p.assessment_status, p.missing_context,
               l.location_name, t.pain_type_name, c.severity_label, d.action_guide
        FROM pain_logs p
        LEFT JOIN pain_locations l           ON l.location_id  = p.pain_location_id
        LEFT JOIN pain_types t               ON t.pain_type_id = p.pain_type_id
        LEFT JOIN pain_scale_dictionary d    ON d.pain_score   = p.pain_score
        LEFT JOIN pain_severity_categories c ON c.severity_id  = d.severity_id
        WHERE p.log_id = :id AND p.user_id = :u
    """), {"id": log_id, "u": user_id}).mappings().first()
    if row is None:
        return None

    # 금기 → 주의 → 추천 순서 (안전 정보를 먼저), 같은 단계면 규칙 priority 순
    guides = conn.execute(text("""
        SELECT g.idx AS guide_id, g.exercise_id, e.exercise_name,
               gl.level_code, gl.level_label, g.guide_message AS message, g.rule_id
        FROM pain_log_guide g
        JOIN exercises e     ON e.exercise_id     = g.exercise_id
        JOIN guide_levels gl ON gl.guide_level_id = g.guide_level_id
        LEFT JOIN exercise_guide_rules r ON r.rule_id = g.rule_id
        WHERE g.log_id = :id
        ORDER BY gl.guide_level_id DESC, COALESCE(r.priority, 99), g.idx
    """), {"id": log_id}).mappings().all()

    # JSON 컬럼은 문자열로 올 수 있음 → 리스트로 변환 (예전 기록 NULL은 그대로 None)
    missing = row["missing_context"]
    if isinstance(missing, str):
        missing = json.loads(missing)

    return PainLogDetail(
        log_id=row["log_id"],
        recorded_at=as_utc(row["recorded_at"]),
        pain_score=row["pain_score"],
        severity_label=row["severity_label"],
        action_guide=row["action_guide"],
        pain_location_name=row["location_name"],
        pain_type_name=row["pain_type_name"],
        assessment_status=row["assessment_status"],
        missing_context=missing,
        guides=[GuideItem(**g) for g in guides],
        basic_guide=BASIC_GUIDE if row["assessment_status"] == "NO_MATCH" else None,
    )


# ---------------------------------------------------------------------
# POST /api/pain-logs : 저장 → 규칙 판정 → 판정 저장 → 201
# ---------------------------------------------------------------------
@router.post("/pain-logs", response_model=PainLogDetail, status_code=201)
def create_pain_log(body: PainLogCreate, user_id: str = Depends(get_current_user)):
    # 트랜잭션: 통증 저장 ~ 판정 저장까지 전부 성공해야 확정. 하나라도 실패하면 전부 취소
    with engine.begin() as conn:
        # 1. 입력값과 사용자 확인
        if conn.execute(text("SELECT 1 FROM users WHERE user_id = :u"),
                        {"u": user_id}).first() is None:
            raise HTTPException(404, "사용자가 없습니다")
        if conn.execute(text("SELECT 1 FROM pain_locations WHERE location_id = :x"),
                        {"x": body.pain_location_id}).first() is None:
            raise HTTPException(422, "없는 통증 위치입니다")
        if conn.execute(text("SELECT 1 FROM pain_types WHERE pain_type_id = :x"),
                        {"x": body.pain_type_id}).first() is None:
            raise HTTPException(422, "없는 통증 유형입니다")

        # 2. 통증 기록 저장 (판정 상태는 아직 모르니 비워 두고 6번에서 채움)
        res = conn.execute(text("""
            INSERT INTO pain_logs (user_id, pain_location_id, pain_type_id, pain_score, recorded_at)
            VALUES (:u, :loc, :typ, :score, :at)
        """), {"u": user_id, "loc": body.pain_location_id, "typ": body.pain_type_id,
               "score": body.pain_score, "at": utc_now()})
        log_id = res.lastrowid

        # 3~5. 규칙 엔진 (디버깅할 때 여기서 F11로 들어가 보기)
        ctx = rule_engine.collect_context(conn, user_id)              # 3. 맥락 수집
        matched = rule_engine.match_rules(conn, body.pain_score, ctx)  # 4. 규칙 매칭
        final = rule_engine.decide(matched)                           #    충돌 해결
        rule_engine.save_guides(conn, log_id, final)                  # 5. 판정 저장

        # 6. 판정 상태와 빠진 맥락 저장
        conn.execute(text("""
            UPDATE pain_logs SET assessment_status = :st, missing_context = :mc WHERE log_id = :id
        """), {"st": rule_engine.assess_status(final, ctx),
               "mc": json.dumps(ctx.missing), "id": log_id})

        # 7. 저장된 값을 다시 읽어서 응답 (상세 조회와 같은 함수)
        result = load_detail(conn, log_id, user_id)

    return result   # 블록이 에러 없이 끝남 = 확정 → 201
