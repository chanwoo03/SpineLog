# =====================================================================
# routers/dashboard.py : 통증 7일 추이 + 홈 대시보드
# ---------------------------------------------------------------------
# 새로 저장하는 것은 없고, 지금까지 쌓인 기록을 '사용자 현지 날짜' 기준으로 모아서 보여 준다.
# 핵심: 날짜 묶기는 SQL(DATE(recorded_at))이 아니라 파이썬에서 현지 시각으로 바꾼 뒤에 한다.
#       DB 시각은 UTC라서 SQL로 날짜를 자르면 한국 아침 기록이 전날로 묶이기 때문
# =====================================================================
from datetime import UTC, date, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from app.db import engine
from app.deps import get_current_user
from app.services.users import user_goals, user_timezone
from app.timeutil import as_utc, local_date_range_utc, local_today

router = APIRouter(prefix="/api", tags=["대시보드 · 추이"])


def pain_trend(conn, user_id: str, tz: str, days: int) -> list[dict]:
    """최근 days일(오늘 포함) 날짜별 통증 요약. 기록 없는 날은 count 0, 값 null"""
    today = local_today(tz)
    first = today - timedelta(days=days - 1)
    start, _ = local_date_range_utc(tz, first)  # 첫날 0시(현지) → UTC
    _, end = local_date_range_utc(tz, today)  # 오늘 24시(현지) → UTC
    rows = (
        conn.execute(
            text("""
        SELECT recorded_at, pain_score FROM pain_logs
        WHERE user_id = :u AND recorded_at >= :s AND recorded_at < :e
        ORDER BY recorded_at
    """),
            {"u": user_id, "s": start, "e": end},
        )
        .mappings()
        .all()
    )

    zone = ZoneInfo(tz)
    by_day: dict[date, list[int]] = {}
    for r in rows:
        local_day = (
            r["recorded_at"].replace(tzinfo=UTC).astimezone(zone).date()
        )  # UTC → 현지 날짜
        by_day.setdefault(local_day, []).append(r["pain_score"])

    out = []
    for i in range(days):
        d = first + timedelta(days=i)
        s = by_day.get(d, [])
        out.append(
            {
                "date": d.isoformat(),
                "count": len(s),
                "avg": round(sum(s) / len(s), 1) if s else None,
                "max": max(s) if s else None,
                "last": s[-1] if s else None,
            }
        )  # 그날 마지막 기록 (시간순 정렬했으므로)
    return out


# ---------------------------------------------------------------------
# GET /api/pain-trend?days=7 : 통증 추이 (그래프용)
# ---------------------------------------------------------------------
@router.get("/pain-trend")
def get_pain_trend(
    days: int = Query(7, ge=1, le=31), user_id: str = Depends(get_current_user)
):
    with engine.connect() as conn:
        tz = user_timezone(conn, user_id)
        return {"timezone": tz, "days": pain_trend(conn, user_id, tz, days)}


# ---------------------------------------------------------------------
# GET /api/dashboard : 홈 화면 한 번에
# ---------------------------------------------------------------------
@router.get("/dashboard")
def dashboard(user_id: str = Depends(get_current_user)):
    with engine.connect() as conn:
        tz = user_timezone(conn, user_id)
        today = local_today(tz)
        start, end = local_date_range_utc(tz, today)
        p = {"u": user_id, "s": start, "e": end}

        # 1) 오늘 마지막 통증 기록 + 그 판정 요약
        last = (
            conn.execute(
                text("""
            SELECT p.log_id, p.recorded_at, p.pain_score, c.severity_label, p.assessment_status
            FROM pain_logs p
            LEFT JOIN pain_scale_dictionary d ON d.pain_score = p.pain_score
            LEFT JOIN pain_severity_categories c ON c.severity_id = d.severity_id
            WHERE p.user_id = :u AND p.recorded_at >= :s AND p.recorded_at < :e
            ORDER BY p.recorded_at DESC, p.log_id DESC LIMIT 1
        """),
                p,
            )
            .mappings()
            .first()
        )
        guide_counts = {}
        if last:
            for r in conn.execute(
                text("""
                SELECT gl.level_code, COUNT(*) AS n FROM pain_log_guide g
                JOIN guide_levels gl ON gl.guide_level_id = g.guide_level_id
                WHERE g.log_id = :l GROUP BY gl.level_code
            """),
                {"l": last["log_id"]},
            ).mappings():
                guide_counts[r["level_code"]] = r["n"]
        pain_count = conn.execute(
            text("""
            SELECT COUNT(*) FROM pain_logs WHERE user_id = :u AND recorded_at >= :s AND recorded_at < :e
        """),
            p,
        ).scalar()

        # 2) 오늘 체크인 vs 목표
        checkin = (
            conn.execute(
                text("""
            SELECT sleep_minutes, prev_day_steps FROM morning_checkins
            WHERE user_id = :u AND checkin_date = :d
        """),
                {"u": user_id, "d": today},
            )
            .mappings()
            .first()
        )
        goals = user_goals(conn, user_id)

        # 3) 오늘 활동 · 운동
        activity = (
            conn.execute(
                text("""
            SELECT COUNT(*) AS count, COALESCE(SUM(duration_minutes), 0) AS minutes FROM activity_logs
            WHERE user_id = :u AND started_at >= :s AND started_at < :e
        """),
                p,
            )
            .mappings()
            .one()
        )
        exercise_count = conn.execute(
            text("""
            SELECT COUNT(*) FROM exercise_logs WHERE user_id = :u AND performed_at >= :s AND performed_at < :e
        """),
            p,
        ).scalar()
        has_condition = (
            conn.execute(
                text("SELECT 1 FROM user_conditions WHERE user_id = :u LIMIT 1"),
                {"u": user_id},
            ).first()
            is not None
        )

        trend = pain_trend(conn, user_id, tz, 7)

    # 4) 화면에 띄울 할 일 (판정이 PARTIAL/NO_MATCH가 되는 원인을 미리 알려 줌)
    todo = []
    if not has_condition:
        todo.append(
            {
                "code": "CONDITION",
                "message": "질환 정보를 입력하면 운동 판정을 받을 수 있어요",
            }
        )
    if checkin is None:
        todo.append(
            {
                "code": "MORNING_CHECKIN",
                "message": "오늘 아침 체크인을 아직 하지 않았어요",
            }
        )

    return {
        "date": today.isoformat(),
        "timezone": tz,
        "pain": {
            "today_count": pain_count,
            "last": None
            if last is None
            else {
                **dict(last),
                "recorded_at": as_utc(last["recorded_at"]),
                "guide_counts": guide_counts,
            },
        },
        "checkin": None
        if checkin is None
        else {
            **dict(checkin),
            "sleep_goal": goals["target_sleep_minutes"],
            "steps_goal": goals["target_steps"],
            "sleep_ok": checkin["sleep_minutes"] is not None
            and checkin["sleep_minutes"] >= goals["target_sleep_minutes"],
            "steps_ok": checkin["prev_day_steps"] is not None
            and checkin["prev_day_steps"] >= goals["target_steps"],
        },
        "activity": {
            "today_count": activity["count"],
            "today_minutes": int(activity["minutes"]),
        },
        "exercise": {"today_count": exercise_count},
        "pain_trend_7d": trend,
        "todo": todo,
    }
