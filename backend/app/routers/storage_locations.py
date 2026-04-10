from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_org_id
from app.models.storage_location import StorageLocation
from app.schemas.storage_location import (
    StorageLocationCreate,
    StorageLocationResponse,
    StorageLocationUpdate,
)

router = APIRouter(prefix="/api/v1/storage-locations", tags=["storage-locations"])


@router.get("", response_model=list[StorageLocationResponse])
async def list_storage_locations(
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StorageLocation)
        .where(StorageLocation.organization_id == org_id)
        .order_by(StorageLocation.name)
    )
    return result.scalars().all()


@router.post("", response_model=StorageLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_storage_location(
    data: StorageLocationCreate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    loc = StorageLocation(id=str(uuid4()), organization_id=org_id, **data.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.get("/{location_id}", response_model=StorageLocationResponse)
async def get_storage_location(
    location_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StorageLocation).where(
            StorageLocation.id == location_id, StorageLocation.organization_id == org_id
        )
    )
    loc = result.scalar_one_or_none()
    if loc is None:
        raise HTTPException(status_code=404, detail="Storage location not found")
    return loc


@router.patch("/{location_id}", response_model=StorageLocationResponse)
async def update_storage_location(
    location_id: str,
    data: StorageLocationUpdate,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StorageLocation).where(
            StorageLocation.id == location_id, StorageLocation.organization_id == org_id
        )
    )
    loc = result.scalar_one_or_none()
    if loc is None:
        raise HTTPException(status_code=404, detail="Storage location not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.delete("/{location_id}")
async def delete_storage_location(
    location_id: str,
    org_id: str = Depends(get_current_org_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StorageLocation).where(
            StorageLocation.id == location_id, StorageLocation.organization_id == org_id
        )
    )
    loc = result.scalar_one_or_none()
    if loc is None:
        raise HTTPException(status_code=404, detail="Storage location not found")
    await db.delete(loc)
    await db.commit()
    return {"deleted": True}
