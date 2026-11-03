# =====================================================================
# routers/contents.py : 의학 콘텐츠 + OX 퀴즈
# ---------------------------------------------------------------------
# 콘텐츠·퀴즈 문구는 의학 내용이라 찬우가 출처(source_url)와 함께 DB에 넣는다.
# 이 API는 읽기 + 열람 기록 + 퀴즈 풀이 기록만 한다. (지금 DB는 비어 있어서 목록이 [])
# =====================================================================
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user
from app.services.users import user_timezone
from app.timeutil import as_utc, utc_now

router = APIRouter(prefix="/api", tags=["의학 콘텐츠"])


class QuizAnswerIn(BaseModel):
    answer: bool  # O = true, X = false


# ---------------------------------------------------------------------
# GET /api/contents?condition_id=&category_id= : 콘텐츠 목록 (+ 내가 읽었는지)
# ---------------------------------------------------------------------
@router.get("/contents")
def list_contents(
    condition_id: int | None = Query(None),
    category_id: int | None = Query(None),
    user_id: str = Depends(get_current_user),
):
    with engine.connect() as conn:
        categories = (
            conn.execute(
                text("""
            SELECT category_id, category_name, broader_category_id FROM content_categories ORDER BY category_id
        """)
            )
            .mappings()
            .all()
        )
        # 조건을 안 주면(NULL) 그 조건은 안 봄 → 규칙 판정의 'NULL = 조건 없음'과 같은 방식
        rows = (
            conn.execute(
                text("""
            SELECT m.content_id, m.title, m.summary, m.category_id, cc.category_name,
                   m.condition_id, c.disease_name,
                   EXISTS (SELECT 1 FROM content_views v
                           WHERE v.content_id = m.content_id AND v.user_id = :u) AS viewed
            FROM medical_contents m
            JOIN content_categories cc ON cc.category_id = m.category_id
            LEFT JOIN conditions c ON c.condition_id = m.condition_id
            WHERE (:cond IS NULL OR m.condition_id = :cond)
              AND (:cat IS NULL OR m.category_id = :cat)
            ORDER BY m.content_id
        """),
                {"u": user_id, "cond": condition_id, "cat": category_id},
            )
            .mappings()
            .all()
        )
    return {
        "categories": [dict(r) for r in categories],
        "items": [{**dict(r), "viewed": bool(r["viewed"])} for r in rows],
    }


# ---------------------------------------------------------------------
# GET /api/contents/{content_id} : 본문 + 퀴즈(정답은 안 보냄) + 열람 기록 저장
# ---------------------------------------------------------------------
@router.get("/contents/{content_id}")
def get_content(content_id: int, user_id: str = Depends(get_current_user)):
    with engine.begin() as conn:  # 열람 기록을 INSERT하므로 begin()
        user_timezone(conn, user_id)
        row = (
            conn.execute(
                text("""
            SELECT m.content_id, m.title, m.summary, m.body, m.source_url, m.created_at,
                   cc.category_name, c.disease_name
            FROM medical_contents m
            JOIN content_categories cc ON cc.category_id = m.category_id
            LEFT JOIN conditions c ON c.condition_id = m.condition_id
            WHERE m.content_id = :id
        """),
                {"id": content_id},
            )
            .mappings()
            .first()
        )
        if row is None:
            raise HTTPException(404, "콘텐츠가 없습니다")
        quizzes = (
            conn.execute(
                text("""
            SELECT quiz_id, question FROM content_quizzes WHERE content_id = :id ORDER BY quiz_id
        """),
                {"id": content_id},
            )
            .mappings()
            .all()
        )
        conn.execute(
            text(
                "INSERT INTO content_views (user_id, content_id, viewed_at) VALUES (:u, :c, :at)"
            ),
            {"u": user_id, "c": content_id, "at": utc_now()},
        )
    return {
        **dict(row),
        "created_at": as_utc(row["created_at"]),
        "quizzes": [dict(q) for q in quizzes],
    }


# ---------------------------------------------------------------------
# POST /api/quizzes/{quiz_id}/attempts : OX 퀴즈 풀기 → 정답 여부 + 해설
# ---------------------------------------------------------------------
@router.post("/quizzes/{quiz_id}/attempts", status_code=201)
def answer_quiz(
    quiz_id: int, body: QuizAnswerIn, user_id: str = Depends(get_current_user)
):
    with engine.begin() as conn:
        user_timezone(conn, user_id)
        q = (
            conn.execute(
                text("""
            SELECT quiz_id, question, correct_answer, explanation FROM content_quizzes WHERE quiz_id = :q
        """),
                {"q": quiz_id},
            )
            .mappings()
            .first()
        )
        if q is None:
            raise HTTPException(404, "퀴즈가 없습니다")
        conn.execute(
            text("""
            INSERT INTO quiz_attempts (user_id, quiz_id, user_answer, attempted_at) VALUES (:u, :q, :a, :at)
        """),
            {"u": user_id, "q": quiz_id, "a": body.answer, "at": utc_now()},
        )
    # 정답 여부는 저장하지 않고 계산 (user_answer = correct_answer → 3정규형)
    return {
        "quiz_id": quiz_id,
        "your_answer": body.answer,
        "correct_answer": bool(q["correct_answer"]),
        "is_correct": body.answer == bool(q["correct_answer"]),
        "explanation": q["explanation"],
    }
