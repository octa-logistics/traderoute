from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_org_id
from app.models.item import Item
from app.models.item_processing_log import ItemProcessingLog
from app.models.organization import Organization
from app.schemas.item import (
    ItemCreate,
    ItemDetailResponse,
    ItemProcessingLogCreate,
    ItemProcessingLogResponse,
    ItemResponse,
    ItemUpdate,
)
from app.services.cost_calculator import calculate_item_costs

router = APIRouter(prefix="/api/v1/items", tags=["items"])


@router.get("", response_model=list[ItemResponse])
async def list_items(
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
    item_status: str | None = Query(None, alias="status"),
    category_id: str | None = Query(None, alias="categoryId"),
    purchase_deal_id: str | None = Query(None, alias="purchaseDealId"),
):
    query = select(Item).where(Item.organization_id == org_id)
    if item_status:
        query = query.where(Item.status == item_status)
    if category_id:
        query = query.where(Item.category_id == category_id)
    if purchase_deal_id:
        query = query.where(Item.purchase_deal_id == purchase_deal_id)

    query = query.options(
        selectinload(Item.category),
        selectinload(Item.storage_location),
        selectinload(Item.processing_logs),
        selectinload(Item.sale_line_item),
    ).order_by(Item.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ItemCreate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    item = Item(
        id=str(uuid4()),
        organization_id=org_id,
        **data.model_dump(),
    )
    db.add(item)
    await db.commit()

    result = await db.execute(
        select(Item)
        .where(Item.id == item.id)
        .options(
            selectinload(Item.category),
            selectinload(Item.storage_location),
        )
    )
    return result.scalar_one()


@router.get("/{item_id}", response_model=ItemDetailResponse)
async def get_item(
    item_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item)
        .where(Item.id == item_id, Item.organization_id == org_id)
        .options(
            selectinload(Item.category),
            selectinload(Item.storage_location),
            selectinload(Item.processing_logs),
            selectinload(Item.sale_line_item),
            selectinload(Item.organization),
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    processing_total = sum(log.cost for log in item.processing_logs)
    sale_price = item.sale_line_item.sale_price if item.sale_line_item else None
    costs = calculate_item_costs(item, item.organization, processing_total, sale_price)

    return ItemDetailResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        sku=item.sku,
        status=item.status.value,
        category_id=item.category_id,
        storage_location_id=item.storage_location_id,
        purchase_deal_id=item.purchase_deal_id,
        organization_id=item.organization_id,
        allocated_purchase_cost=item.allocated_purchase_cost,
        allocated_fees=item.allocated_fees,
        created_at=item.created_at,
        updated_at=item.updated_at,
        category=item.category,
        storage_location=item.storage_location,
        processing_logs=item.processing_logs,
        sale_line_item=item.sale_line_item,
        costs=costs,
    )


@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: str,
    data: ItemUpdate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.organization_id == org_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()

    result = await db.execute(
        select(Item)
        .where(Item.id == item.id)
        .options(
            selectinload(Item.category),
            selectinload(Item.storage_location),
            selectinload(Item.processing_logs),
            selectinload(Item.sale_line_item),
        )
    )
    return result.scalar_one()


@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.organization_id == org_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return {"deleted": True}


# --- Processing Logs (nested under items) ---


@router.get("/{item_id}/processing-logs", response_model=list[ItemProcessingLogResponse])
async def list_processing_logs(
    item_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ItemProcessingLog)
        .where(ItemProcessingLog.item_id == item_id)
        .order_by(ItemProcessingLog.date.desc())
    )
    return result.scalars().all()


@router.post(
    "/{item_id}/processing-logs",
    response_model=ItemProcessingLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_processing_log(
    item_id: str,
    data: ItemProcessingLogCreate,
    db: AsyncSession = Depends(get_db),
):
    log = ItemProcessingLog(
        id=str(uuid4()),
        item_id=item_id,
        description=data.description,
        cost=data.cost,
        date=data.date or datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
