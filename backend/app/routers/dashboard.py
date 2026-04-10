from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_org_id
from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import get_dashboard_stats

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    return await get_dashboard_stats(db, org_id)
