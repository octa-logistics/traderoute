import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate, ShipmentResponse
from app.services.shipment_service import ShipmentService, InvalidShipmentTransitionError

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.get("")
async def list_shipments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: ShipmentStatus | None = None,
    orderId: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    conditions = []
    if status:
        conditions.append(Shipment.status == status)
    if orderId:
        conditions.append(Shipment.orderId == orderId)

    count_q = select(func.count()).select_from(Shipment)
    list_q = (
        select(Shipment)
        .options(selectinload(Shipment.order), selectinload(Shipment.warehouse))
        .order_by(Shipment.createdAt.desc())
    )
    for cond in conditions:
        count_q = count_q.where(cond)
        list_q = list_q.where(cond)

    total = (await db.execute(count_q)).scalar()
    result = await db.execute(list_q.offset(offset).limit(limit))
    shipments = result.scalars().all()

    data = []
    for s in shipments:
        d = ShipmentResponse.model_validate(s).model_dump()
        d["order"] = {"id": s.order.id, "orderNumber": s.order.orderNumber} if s.order else None
        d["warehouse"] = {"id": s.warehouse.id, "name": s.warehouse.name} if s.warehouse else None
        data.append(d)

    return {"data": data, "total": total, "page": page, "limit": limit}


@router.post("", status_code=201)
async def create_shipment(body: ShipmentCreate, db: AsyncSession = Depends(get_db)):
    shipment = Shipment(id=cuid2.cuid_wrapper()(), **body.model_dump())
    db.add(shipment)
    await db.commit()

    result = await db.execute(
        select(Shipment)
        .options(selectinload(Shipment.order), selectinload(Shipment.warehouse))
        .where(Shipment.id == shipment.id)
    )
    shipment = result.scalar_one()
    d = ShipmentResponse.model_validate(shipment).model_dump()
    d["order"] = {"id": shipment.order.id, "orderNumber": shipment.order.orderNumber} if shipment.order else None
    d["warehouse"] = {"id": shipment.warehouse.id, "name": shipment.warehouse.name} if shipment.warehouse else None
    return d


@router.get("/{shipment_id}")
async def get_shipment(shipment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Shipment)
        .options(selectinload(Shipment.order), selectinload(Shipment.warehouse))
        .where(Shipment.id == shipment_id)
    )
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    d = ShipmentResponse.model_validate(shipment).model_dump()
    d["order"] = {"id": shipment.order.id, "orderNumber": shipment.order.orderNumber} if shipment.order else None
    d["warehouse"] = {"id": shipment.warehouse.id, "name": shipment.warehouse.name} if shipment.warehouse else None
    return d


@router.patch("/{shipment_id}")
async def update_shipment(
    shipment_id: str, body: ShipmentUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    updates = body.model_dump(exclude_unset=True)

    if "status" in updates:
        new_status = updates["status"]
        try:
            ShipmentService.validate_status_transition(shipment.status, new_status)
        except InvalidShipmentTransitionError as e:
            raise HTTPException(status_code=400, detail=str(e))
        ShipmentService.apply_status_side_effects(shipment, new_status)

    for key, value in updates.items():
        setattr(shipment, key, value)

    await db.commit()
    await db.refresh(shipment)
    return ShipmentResponse.model_validate(shipment)
