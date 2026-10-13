# =====================================================================
# timeutil.py : 시간 도구 (저장은 UTC, 보여 줄 때만 사용자 시간대)
# =====================================================================
from datetime import datetime, timezone


def utc_now() -> datetime:
    """지금 시각(UTC). DB에 넣을 때 쓴다.
    tzinfo를 떼는 이유: DB 연결이 이미 UTC(+00:00)라서 "표시 없는 UTC"로 넣기로 약속
    microsecond=0 : DB TIMESTAMP는 초 단위까지만 저장하므로 응답과 DB 값을 맞춤
    """
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def as_utc(dt: datetime | None) -> datetime | None:
    """DB에서 꺼낸 '표시 없는 UTC'에 UTC 표시를 붙인다 → 응답이 ...Z 형태가 됨
    (Z가 없으면 화면이 한국 시각으로 오해할 수 있음)
    """
    return dt.replace(tzinfo=timezone.utc) if dt else None


# ---- 아래는 API-3(규칙 엔진)에서 추가 : 사용자 시간대 기준 '오늘', '어제' ----
from datetime import date, time, timedelta
from zoneinfo import ZoneInfo   # "Asia/Seoul" 같은 이름으로 시간대를 다룸 (서머타임 자동 처리)


def local_today(tz_name: str) -> date:
    """사용자 시간대 기준 오늘 날짜. 예) UTC 10/13 23:00 = 한국 10/14 → 10/14"""
    return datetime.now(ZoneInfo(tz_name)).date()


def local_date_range_utc(tz_name: str, d: date) -> tuple[datetime, datetime]:
    """사용자 시간대의 날짜 d 0시~24시를 UTC 범위로 바꾼다.
    예) 한국 10/14 00:00~10/15 00:00 → UTC 10/13 15:00~10/14 15:00
    """
    start = datetime.combine(d, time.min, tzinfo=ZoneInfo(tz_name))
    end = start + timedelta(days=1)
    to_utc = lambda x: x.astimezone(timezone.utc).replace(tzinfo=None)
    return to_utc(start), to_utc(end)
