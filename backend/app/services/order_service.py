from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.shipment import Shipment, ShipmentStatus


VALID_STATUS_TRANSITIONS = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PROCESSING, OrderStatus.CANCELLED},
    OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


class InvalidStatusTransitionError(Exception):
    def __init__(self, current: OrderStatus, requested: OrderStatus):
        super().__init__(f"Cannot transition order from {current.value} to {requested.value}")
        self.current = current
        self.requested = requested


class OrderService:
    @staticmethod
    def validate_status_transition(current: OrderStatus, new: OrderStatus) -> None:
        allowed = VALID_STATUS_TRANSITIONS.get(current, set())
        if new not in allowed:
            raise InvalidStatusTransitionError(current, new)

    @staticmethod
    async def can_fulfill(db: AsyncSession, order_id: str) -> dict:
        result = await db.execute(
            select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            return {"fulfillable": False, "reason": "Order not found"}

        from app.services.inventory_service import InventoryService

        issues = []
        for item in order.items:
            total = await InventoryService.get_total_stock(db, item.productId)
            if total < item.quantity:
                issues.append({
                    "productId": item.productId,
                    "productName": item.product.name if item.product else item.productId,
                    "requested": item.quantity,
                    "available": total,
                })

        return {
            "fulfillable": len(issues) == 0,
            "issues": issues,
        }
