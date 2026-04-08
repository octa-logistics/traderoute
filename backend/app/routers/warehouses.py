import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryItem
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("")
async def list_warehouses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    total_q = await db.execute(select(func.count()).select_from(Warehouse))
    total = total_q.scalar()

    result = await db.execute(
        select(Warehouse).order_by(Warehouse.createdAt.desc()).offset(offset).limit(limit)
    )
    warehouses = result.scalars().all()

    return {
        "data": [WarehouseResponse.model_validate(w) for w in warehouses],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", status_code=201)
async def create_warehouse(body: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    warehouse = Warehouse(id=cuid2.cuid_wrapper()(), **body.model_dump())
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return WarehouseResponse.model_validate(warehouse)


@router.get("/{warehouse_id}")
async def get_warehouse(warehouse_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Warehouse)
        .options(selectinload(Warehouse.inventory).selectinload(InventoryItem.product))
        .where(Warehouse.id == warehouse_id)
    )
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    data = WarehouseResponse.model_validate(warehouse).model_dump()
    data["inventory"] = [
        {
            "id": inv.id,
            "productId": inv.productId,
            "quantity": inv.quantity,
            "reorderPoint": inv.reorderPoint,
            "product": {
                "id": inv.product.id,
                "sku": inv.product.sku,
                "name": inv.product.name,
            } if inv.product else None,
        }
        for inv in warehouse.inventory
    ]
    return data


@router.patch("/{warehouse_id}")
async def update_warehouse(
    warehouse_id: str, body: WarehouseUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(warehouse, key, value)

    await db.commit()
    await db.refresh(warehouse)
    return WarehouseResponse.model_validate(warehouse)
