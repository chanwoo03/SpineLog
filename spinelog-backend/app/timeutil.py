from datetime import datetime, timezone


def utc_now() -> datetime:
    """지금 시각(UTC). DB에 넣을 때 쓴다.
    DB 연결이 이미 UTC라서 '표시 없는 UTC'로 넣고, DB처럼 초 단위로 맞춘다."""
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def as_utc(dt: datetime | None) -> datetime | None:
    """DB에서 꺼낸 값에 UTC 표시를 붙인다 → 응답이 ...Z 형태가 된다.
    (Z가 없으면 화면이 한국 시각으로 오해할 수 있음)"""
    return dt.replace(tzinfo=timezone.utc) if dt else None