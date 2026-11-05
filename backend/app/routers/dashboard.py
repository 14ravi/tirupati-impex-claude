from fastapi import APIRouter
from pydantic import BaseModel

from app.deps import CurrentUser

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    emails_waiting_approval: int
    replies_to_handle: int
    leads_expiring_soon: int
    leads_generated_30d: int
    emails_sent_30d: int
    reply_rate_30d: float | None
    credits_used_30d: int


@router.get("/summary")
def summary(user: CurrentUser) -> DashboardSummary:
    # The leads and emails tables arrive with the lead workflow. Until then every count is zero.
    return DashboardSummary(
        emails_waiting_approval=0,
        replies_to_handle=0,
        leads_expiring_soon=0,
        leads_generated_30d=0,
        emails_sent_30d=0,
        reply_rate_30d=None,
        credits_used_30d=0,
    )
