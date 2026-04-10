from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_org_id
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorResponse, VendorUpdate

router = APIRouter(prefix="/api/v1/vendors", tags=["vendors"])


@router.get("", response_model=list[VendorResponse])
async def list_vendors(
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vendor).where(Vendor.organization_id == org_id).order_by(Vendor.name)
    )
    return result.scalars().all()


@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: VendorCreate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    vendor = Vendor(id=str(uuid4()), organization_id=org_id, **data.model_dump())
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.organization_id == org_id)
    )
    vendor = result.scalar_one_or_none()
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.patch("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: str,
    data: VendorUpdate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.organization_id == org_id)
    )
    vendor = result.scalar_one_or_none()
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.organization_id == org_id)
    )
    vendor = result.scalar_one_or_none()
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    await db.delete(vendor)
    await db.commit()
    return {"deleted": True}
