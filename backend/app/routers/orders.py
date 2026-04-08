import cuid2

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.shipment import Shipment
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.services.order_service import OrderService, InvalidStatusTransitionError

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: OrderStatus | None = None,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    conditions = []
    if status:
        conditions.append(Order.status == status)

    count_q = select(func.count()).select_from(Order)
    list_q = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.shipments),
        )
        .order_by(Order.createdAt.desc())
    )
    for cond in conditions:
        count_q = count_q.where(cond)
        list_q = list_q.where(cond)

    total = (await db.execute(count_q)).scalar()
    result = await db.execute(list_q.offset(offset).limit(limit))
    orders = result.scalars().unique().all()

    data = []
    for order in orders:
        d = OrderResponse.model_validate(order).model_dump()
        d["items"] = [
            {
                "id": item.id,
                "productId": item.productId,
                "quantity": item.quantity,
                "unitPrice": item.unitPrice,
                "product": {
                    "id": item.product.id,
                    "sku": item.product.sku,
                    "name": item.product.name,
                } if item.product else None,
            }
            for item in order.items
        ]
        d["shipments"] = [
            {
                "id": s.id,
                "status": s.status.value if hasattr(s.status, 'value') else s.status,
                "carrier": s.carrier,
                "trackingNumber": s.trackingNumber,
            }
            for s in order.shipments
        ]
        data.append(d)

    return {"data": data, "total": total, "page": page, "limit": limit}


@router.post("", status_code=201)
async def create_order(body: OrderCreate, db: AsyncSession = Depends(get_db)):
    order_data = body.model_dump(exclude={"items"})
    order_id = cuid2.cuid_wrapper()()
    order = Order(id=order_id, **order_data)
    db.add(order)

    for item_data in body.items:
        order_item = OrderItem(
            id=cuid2.cuid_wrapper()(),
            orderId=order_id,
            **item_data.model_dump(),
        )
        db.add(order_item)

    await db.commit()

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    order = result.scalar_one()

    d = OrderResponse.model_validate(order).model_dump()
    d["items"] = [
        {
            "id": item.id,
            "productId": item.productId,
            "quantity": item.quantity,
            "unitPrice": item.unitPrice,
            "product": {
                "id": item.product.id,
                "sku": item.product.sku,
                "name": item.product.name,
            } if item.product else None,
        }
        for item in order.items
    ]
    return d


@router.get("/{order_id}")
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.shipments).selectinload(Shipment.warehouse),
        )
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    d = OrderResponse.model_validate(order).model_dump()
    d["items"] = [
        {
            "id": item.id,
            "productId": item.productId,
            "quantity": item.quantity,
            "unitPrice": item.unitPrice,
            "product": {
                "id": item.product.id,
                "sku": item.product.sku,
                "name": item.product.name,
            } if item.product else None,
        }
        for item in order.items
    ]
    d["shipments"] = [
        {
            "id": s.id,
            "warehouseId": s.warehouseId,
            "status": s.status.value if hasattr(s.status, 'value') else s.status,
            "carrier": s.carrier,
            "trackingNumber": s.trackingNumber,
            "warehouse": {
                "id": s.warehouse.id,
                "name": s.warehouse.name,
            } if s.warehouse else None,
        }
        for s in order.shipments
    ]
    return d


@router.patch("/{order_id}")
async def update_order(
    order_id: str, body: OrderUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updates = body.model_dump(exclude_unset=True)

    if "status" in updates:
        new_status = updates["status"]
        try:
            OrderService.validate_status_transition(order.status, new_status)
        except InvalidStatusTransitionError as e:
            raise HTTPException(status_code=400, detail=str(e))

    for key, value in updates.items():
        setattr(order, key, value)

    await db.commit()
    await db.refresh(order)
    return OrderResponse.model_validate(order)


@router.get("/{order_id}/fulfillment-check")
async def check_fulfillment(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await OrderService.can_fulfill(db, order_id)
    if result.get("reason") == "Order not found":
        raise HTTPException(status_code=404, detail="Order not found")
    return result
