# =====================================================================
# services/rule_engine.py : 규칙 엔진 (이 서비스의 핵심)
# ---------------------------------------------------------------------
# LLM이 아니라 DB의 규칙(exercise_guide_rules)으로만 판정한다.
#   → 같은 입력이면 항상 같은 결과, 어떤 규칙(rule_id) 때문인지 추적 가능
#
# 순서
#   1. collect_context : 사용자 맥락 모으기 (질환·등급, 증상, 최근 활동 태그, 오늘 수면)
#   2. match_rules     : 조건에 맞는 규칙 고르기
#   3. decide          : 운동별 최종 판정 (금기 > 주의 > 추천, 같으면 priority 작은 것)
#   4. assess_status   : 판정 상태 (COMPLETED / PARTIAL / NO_MATCH)
#   5. save_guides     : 판정 결과 저장 (당시 안내 문구 포함)
# =====================================================================

from dataclasses import dataclass, field
from datetime import timedelta

from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.timeutil import local_date_range_utc, local_today, utc_now

# 엄격한 순서. 같은 운동에 추천과 금기가 같이 걸리면 금기를 따른다 (안전 우선)
LEVEL_RANK = {"CONTRAINDICATED": 3, "CAUTION": 2, "RECOMMENDED": 1}


@dataclass
class UserContext:
    """판정에 필요한 사용자 정보를 한곳에 담는 상자"""
    timezone: str
    grades: dict = field(default_factory=dict)        # {질환 id: 등급}  예) {3: 2}
    symptom_ids: set = field(default_factory=set)     # {증상 id}        예) {1}
    recent_tag_ids: set = field(default_factory=set)  # 어제~오늘 활동의 동작 태그
    sleep_minutes: int | None = None                  # 오늘 아침 체크인의 지난밤 수면(분)
    missing: list = field(default_factory=list)       # 판정에 필요한데 없는 자료


def collect_context(conn: Connection, user_id: str) -> UserContext:
    """1단계: 사용자 맥락 수집 (테이블 6개 조회)"""
    tz = conn.execute(text("SELECT timezone FROM users WHERE user_id = :u"),
                      {"u": user_id}).scalar_one()
    ctx = UserContext(timezone=tz)

    # 질환·등급 ← user_conditions
    for cid, grade in conn.execute(text(
            "SELECT condition_id, disease_grade FROM user_conditions WHERE user_id = :u"),
            {"u": user_id}):
        ctx.grades[cid] = grade

    # 증상 ← user_symptoms
    ctx.symptom_ids = set(conn.execute(text(
        "SELECT symptom_id FROM user_symptoms WHERE user_id = :u"), {"u": user_id}).scalars())

    # 최근 활동 태그 ← activity_logs + activity_type_tags ('어제 0시(사용자 현지)' 이후)
    yesterday = local_today(tz) - timedelta(days=1)
    yesterday_start, _ = local_date_range_utc(tz, yesterday)   # 어제 0시를 UTC로
    ctx.recent_tag_ids = set(conn.execute(text("""
        SELECT DISTINCT att.tag_id
        FROM activity_logs al
        JOIN activity_type_tags att ON att.activity_type_id = al.activity_type_id
        WHERE al.user_id = :u AND al.started_at >= :start
    """), {"u": user_id, "start": yesterday_start}).scalars())

    # 지난밤 수면 ← morning_checkins (checkin_date는 사용자 현지 날짜)
    ctx.sleep_minutes = conn.execute(text("""
        SELECT sleep_minutes FROM morning_checkins
        WHERE user_id = :u AND checkin_date = :d
    """), {"u": user_id, "d": local_today(tz)}).scalar()

    # 빠진 맥락 기록 (증상·활동은 없을 수도 있는 게 정상이라 제외)
    if not ctx.grades:
        ctx.missing.append("CONDITION")         # 질환 정보 없음 → 질환 규칙 판단 불가
    if ctx.sleep_minutes is None:
        ctx.missing.append("MORNING_CHECKIN")   # 오늘 체크인 없음 → 수면 규칙 판단 불가
    return ctx


def match_rules(conn: Connection, pain_score: int, ctx: UserContext) -> list[dict]:
    """2단계: 규칙 매칭. 규칙의 조건 칸이 NULL이면 '그 조건은 안 봄'."""
    rows = conn.execute(text("""
        SELECT r.*, g.level_code
        FROM exercise_guide_rules r
        JOIN guide_levels g ON g.guide_level_id = r.guide_level_id
        WHERE (r.min_pain_score IS NULL OR :s >= r.min_pain_score)
          AND (r.max_pain_score IS NULL OR :s <= r.max_pain_score)
    """), {"s": pain_score}).mappings().all()

    matched = []
    for r in rows:
        cond = r["target_condition_id"]
        if cond is not None and cond not in ctx.grades:                  # 그 질환이 없음
            continue
        if r["min_stage_level"] is not None or r["max_stage_level"] is not None:
            grade = ctx.grades.get(cond)
            lo = r["min_stage_level"] if r["min_stage_level"] is not None else -99
            hi = r["max_stage_level"] if r["max_stage_level"] is not None else 99
            if grade is None or not (lo <= grade <= hi):                  # 등급 범위 밖
                continue
        if r["target_symptom_id"] is not None and r["target_symptom_id"] not in ctx.symptom_ids:
            continue                                                      # 그 증상이 없음
        if r["target_tag_id"] is not None and r["target_tag_id"] not in ctx.recent_tag_ids:
            continue                                                      # 그 동작을 안 함
        if r["max_sleep_minutes"] is not None and (
                ctx.sleep_minutes is None or ctx.sleep_minutes > r["max_sleep_minutes"]):
            continue                                                      # 수면 조건 불충족
        matched.append(dict(r))
    return matched


def decide(matched: list[dict]) -> dict[int, dict]:
    """3단계: 운동 하나에 규칙이 여러 개면 하나만. 금기 > 주의 > 추천, 같으면 priority 작은 것"""
    final: dict[int, dict] = {}
    for r in matched:
        key = (-LEVEL_RANK[r["level_code"]], r["priority"])   # 작을수록 이김
        cur = final.get(r["exercise_id"])
        if cur is None or key < cur["_key"]:
            final[r["exercise_id"]] = {**r, "_key": key}
    return final


def assess_status(final: dict, ctx: UserContext) -> str:
    """4단계: 판정 상태. 운동의 추천/주의/금기와는 별개.
    '판단할 자료가 없었다'를 '추천'처럼 보이지 않게 구분한다."""
    if not final:
        return "NO_MATCH"
    if ctx.missing:
        return "PARTIAL"
    return "COMPLETED"


def save_guides(conn: Connection, log_id: int, final: dict[int, dict]) -> None:
    """5단계: 운동마다 pain_log_guide에 1행. 당시 안내 문구(guide_message)까지 스냅샷으로 저장"""
    now = utc_now()
    for ex_id, r in final.items():
        conn.execute(text("""
            INSERT INTO pain_log_guide (log_id, exercise_id, guide_level_id, rule_id, guide_message, generated_at)
            VALUES (:log, :ex, :lv, :rule, :msg, :at)
        """), {"log": log_id, "ex": ex_id, "lv": r["guide_level_id"], "rule": r["rule_id"],
               "msg": r["guide_message"], "at": now})
