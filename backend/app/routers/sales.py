from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_org_id
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleResponse, SaleUpdate
from app.services.sale_service import create_sale, delete_sale

router = APIRouter(prefix="/api/v1/sales", tags=["sales"])


@router.get("", response_model=list[SaleResponse])
async def list_sales(
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sale)
        .where(Sale.organization_id == org_id)
        .options(selectinload(Sale.customer), selectinload(Sale.line_items))
        .order_by(Sale.date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale_endpoint(
    data: SaleCreate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    return await create_sale(db, org_id, data)


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sale)
        .where(Sale.id == sale_id, Sale.organization_id == org_id)
        .options(selectinload(Sale.customer), selectinload(Sale.line_items))
    )
    sale = result.scalar_one_or_none()
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.patch("/{sale_id}", response_model=SaleResponse)
async def update_sale(
    sale_id: str,
    data: SaleUpdate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.organization_id == org_id)
    )
    sale = result.scalar_one_or_none()
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sale, field, value)
    await db.commit()

    result = await db.execute(
        select(Sale)
        .where(Sale.id == sale.id)
        .options(selectinload(Sale.customer), selectinload(Sale.line_items))
    )
    return result.scalar_one()


@router.delete("/{sale_id}")
async def delete_sale_endpoint(
    sale_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        await delete_sale(db, sale_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"deleted": True}
