# =====================================================================
# tests/test_rule_engine.py : 규칙 충돌 해결(decide)과 판정 상태 테스트
# ---------------------------------------------------------------------
# DB 없이 '가짜 규칙'을 만들어서 decide()에 넣어 보고, 기대한 규칙이 이기는지 확인한다.
# 실행: (venv) spinelog-backend 폴더에서  python -m pytest -v
# =====================================================================
from app.services.rule_engine import UserContext, assess_status, decide


def rule(rule_id, exercise_id, level_code, priority=1):
    """테스트용 가짜 규칙 (match_rules가 돌려주는 dict와 같은 모양)"""
    level_id = {"RECOMMENDED": 1, "CAUTION": 2, "CONTRAINDICATED": 3}[level_code]
    return {
        "rule_id": rule_id,
        "exercise_id": exercise_id,
        "level_code": level_code,
        "guide_level_id": level_id,
        "priority": priority,
        "guide_message": f"규칙 {rule_id}",
    }


def test_금기가_추천을_이긴다():
    """같은 운동에 추천과 금기가 같이 걸리면 금기 (안전 우선)"""
    final = decide([rule(1, 5, "RECOMMENDED"), rule(2, 5, "CONTRAINDICATED")])
    assert final[5]["rule_id"] == 2


def test_순서가_바뀌어도_금기가_이긴다():
    """규칙이 들어오는 순서와 상관없이 결과가 같아야 한다 (결정론적)"""
    final = decide([rule(2, 5, "CONTRAINDICATED"), rule(1, 5, "RECOMMENDED")])
    assert final[5]["rule_id"] == 2


def test_priority가_좋아도_레벨이_먼저다():
    """추천 규칙의 priority가 1(가장 우선)이어도, priority 9인 주의 규칙이 이긴다"""
    final = decide(
        [rule(1, 5, "RECOMMENDED", priority=1), rule(2, 5, "CAUTION", priority=9)]
    )
    assert final[5]["rule_id"] == 2


def test_같은_레벨이면_priority_작은_것():
    """둘 다 주의면 priority 숫자가 작은 규칙"""
    final = decide(
        [rule(1, 5, "CAUTION", priority=3), rule(2, 5, "CAUTION", priority=1)]
    )
    assert final[5]["rule_id"] == 2


def test_운동이_다르면_서로_영향_없음():
    final = decide([rule(1, 5, "CONTRAINDICATED"), rule(2, 9, "RECOMMENDED")])
    assert final[5]["level_code"] == "CONTRAINDICATED"
    assert final[9]["level_code"] == "RECOMMENDED"


def test_규칙이_없으면_NO_MATCH():
    ctx = UserContext(timezone="Asia/Seoul", grades={3: 2})
    assert assess_status(decide([]), ctx) == "NO_MATCH"


def test_자료가_빠지면_PARTIAL():
    ctx = UserContext(timezone="Asia/Seoul", grades={3: 2}, missing=["MORNING_CHECKIN"])
    assert assess_status(decide([rule(1, 5, "RECOMMENDED")]), ctx) == "PARTIAL"


def test_자료가_다_있으면_COMPLETED():
    ctx = UserContext(timezone="Asia/Seoul", grades={3: 2}, sleep_minutes=420)
    assert assess_status(decide([rule(1, 5, "RECOMMENDED")]), ctx) == "COMPLETED"
