from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_org_id
from app.models.purchase_deal import PurchaseDeal
from app.schemas.purchase_deal import PurchaseDealCreate, PurchaseDealResponse, PurchaseDealUpdate

router = APIRouter(prefix="/api/v1/purchase-deals", tags=["purchase-deals"])


@router.get("", response_model=list[PurchaseDealResponse])
async def list_purchase_deals(
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseDeal)
        .where(PurchaseDeal.organization_id == org_id)
        .options(selectinload(PurchaseDeal.vendor))
        .order_by(PurchaseDeal.date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=PurchaseDealResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_deal(
    data: PurchaseDealCreate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    deal = PurchaseDeal(
        id=str(uuid4()),
        organization_id=org_id,
        vendor_id=data.vendor_id,
        date=data.date or datetime.now(timezone.utc),
        total_price=data.total_price,
        fees=data.fees,
        taxes=data.taxes,
        notes=data.notes,
    )
    db.add(deal)
    await db.commit()

    result = await db.execute(
        select(PurchaseDeal)
        .where(PurchaseDeal.id == deal.id)
        .options(selectinload(PurchaseDeal.vendor))
    )
    return result.scalar_one()


@router.get("/{deal_id}", response_model=PurchaseDealResponse)
async def get_purchase_deal(
    deal_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseDeal)
        .where(PurchaseDeal.id == deal_id, PurchaseDeal.organization_id == org_id)
        .options(selectinload(PurchaseDeal.vendor))
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        raise HTTPException(status_code=404, detail="Purchase deal not found")
    return deal


@router.patch("/{deal_id}", response_model=PurchaseDealResponse)
async def update_purchase_deal(
    deal_id: str,
    data: PurchaseDealUpdate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseDeal).where(
            PurchaseDeal.id == deal_id, PurchaseDeal.organization_id == org_id
        )
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        raise HTTPException(status_code=404, detail="Purchase deal not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(deal, field, value)
    await db.commit()

    result = await db.execute(
        select(PurchaseDeal)
        .where(PurchaseDeal.id == deal.id)
        .options(selectinload(PurchaseDeal.vendor))
    )
    return result.scalar_one()


@router.delete("/{deal_id}")
async def delete_purchase_deal(
    deal_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseDeal).where(
            PurchaseDeal.id == deal_id, PurchaseDeal.organization_id == org_id
        )
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        raise HTTPException(status_code=404, detail="Purchase deal not found")
    await db.delete(deal)
    await db.commit()
    return {"deleted": True}
