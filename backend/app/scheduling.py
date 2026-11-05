from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo


def parse_time_of_day(value: str) -> time:
    try:
        hours, minutes = value.split(":")
        return time(int(hours), int(minutes))
    except ValueError:
        raise ValueError("Enter the time as HH:MM, e.g. 09:00.") from None


def next_run(
    kind: str,
    *,
    tz: str,
    now: datetime,
    run_at: datetime | None = None,
    time_of_day: str | None = None,
    weekdays: list[int] | None = None,
) -> datetime | None:
    """The next time a schedule fires after `now`, in UTC. None when a one-off run has passed."""
    if kind == "once":
        return run_at.astimezone(UTC) if run_at and run_at > now else None

    zone = ZoneInfo(tz)
    at = parse_time_of_day(time_of_day or "")
    allowed = set(range(7)) if kind == "daily" else set(weekdays or [])
    local_now = now.astimezone(zone)
    for days_ahead in range(8):
        day = local_now.date() + timedelta(days=days_ahead)
        candidate = datetime.combine(day, at, tzinfo=zone)
        if day.weekday() in allowed and candidate > local_now:
            return candidate.astimezone(UTC)
    return None
