import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.product import Product
from app.models.inventory import InventoryItem
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    total_q = await db.execute(select(func.count()).select_from(Product))
    total = total_q.scalar()

    result = await db.execute(
        select(Product).order_by(Product.createdAt.desc()).offset(offset).limit(limit)
    )
    products = result.scalars().all()

    return {
        "data": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", status_code=201)
async def create_product(body: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(id=cuid2.cuid_wrapper()(), **body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


@router.get("/{product_id}")
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.inventory).selectinload(InventoryItem.warehouse))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = ProductResponse.model_validate(product).model_dump()
    data["inventory"] = [
        {
            "id": inv.id,
            "warehouseId": inv.warehouseId,
            "quantity": inv.quantity,
            "reorderPoint": inv.reorderPoint,
            "warehouse": {
                "id": inv.warehouse.id,
                "name": inv.warehouse.name,
                "city": inv.warehouse.city,
                "state": inv.warehouse.state,
            } if inv.warehouse else None,
        }
        for inv in product.inventory
    ]
    return data


@router.patch("/{product_id}")
async def update_product(
    product_id: str, body: ProductUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)
