import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.inventory import InventoryItem
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("")
async def list_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    warehouseId: str | None = None,
    productId: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    conditions = []
    if warehouseId:
        conditions.append(InventoryItem.warehouseId == warehouseId)
    if productId:
        conditions.append(InventoryItem.productId == productId)

    count_q = select(func.count()).select_from(InventoryItem)
    list_q = select(InventoryItem).options(
        selectinload(InventoryItem.product), selectinload(InventoryItem.warehouse)
    )
    for cond in conditions:
        count_q = count_q.where(cond)
        list_q = list_q.where(cond)

    total = (await db.execute(count_q)).scalar()
    result = await db.execute(list_q.offset(offset).limit(limit))
    items = result.scalars().all()

    data = []
    for inv in items:
        d = InventoryResponse.model_validate(inv).model_dump()
        d["product"] = {"id": inv.product.id, "sku": inv.product.sku, "name": inv.product.name} if inv.product else None
        d["warehouse"] = {"id": inv.warehouse.id, "name": inv.warehouse.name} if inv.warehouse else None
        data.append(d)

    return {"data": data, "total": total, "page": page, "limit": limit}


@router.post("", status_code=201)
async def create_inventory(body: InventoryCreate, db: AsyncSession = Depends(get_db)):
    item = InventoryItem(id=cuid2.cuid_wrapper()(), **body.model_dump())
    db.add(item)
    await db.commit()
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.product), selectinload(InventoryItem.warehouse))
        .where(InventoryItem.id == item.id)
    )
    item = result.scalar_one()
    d = InventoryResponse.model_validate(item).model_dump()
    d["product"] = {"id": item.product.id, "sku": item.product.sku, "name": item.product.name} if item.product else None
    d["warehouse"] = {"id": item.warehouse.id, "name": item.warehouse.name} if item.warehouse else None
    return d


@router.get("/low-stock")
async def low_stock_alerts(db: AsyncSession = Depends(get_db)):
    items = await InventoryService.get_low_stock_alerts(db)
    return {"data": [InventoryResponse.model_validate(i) for i in items]}


@router.get("/{item_id}")
async def get_inventory_item(item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.product), selectinload(InventoryItem.warehouse))
        .where(InventoryItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    d = InventoryResponse.model_validate(item).model_dump()
    d["product"] = {"id": item.product.id, "sku": item.product.sku, "name": item.product.name} if item.product else None
    d["warehouse"] = {"id": item.warehouse.id, "name": item.warehouse.name} if item.warehouse else None
    return d


@router.patch("/{item_id}")
async def update_inventory(
    item_id: str, body: InventoryUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return InventoryResponse.model_validate(item)
