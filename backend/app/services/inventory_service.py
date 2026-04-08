from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import InventoryItem
from app.models.order import Order, OrderStatus


class InsufficientStockError(Exception):
    def __init__(self, product_id: str, warehouse_id: str, requested: int, available: int):
        self.product_id = product_id
        self.warehouse_id = warehouse_id
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for product {product_id} in warehouse {warehouse_id}: "
            f"requested {requested}, available {available}"
        )


class InventoryService:
    @staticmethod
    async def check_stock(db: AsyncSession, product_id: str, warehouse_id: str, quantity: int) -> bool:
        result = await db.execute(
            select(InventoryItem).where(
                InventoryItem.productId == product_id,
                InventoryItem.warehouseId == warehouse_id,
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return False
        return item.quantity >= quantity

    @staticmethod
    async def deduct_stock(db: AsyncSession, product_id: str, warehouse_id: str, quantity: int) -> InventoryItem:
        result = await db.execute(
            select(InventoryItem).where(
                InventoryItem.productId == product_id,
                InventoryItem.warehouseId == warehouse_id,
            )
        )
        item = result.scalar_one_or_none()
        if not item or item.quantity < quantity:
            available = item.quantity if item else 0
            raise InsufficientStockError(product_id, warehouse_id, quantity, available)
        item.quantity -= quantity
        await db.flush()
        return item

    @staticmethod
    async def restore_stock(db: AsyncSession, product_id: str, warehouse_id: str, quantity: int) -> InventoryItem:
        result = await db.execute(
            select(InventoryItem).where(
                InventoryItem.productId == product_id,
                InventoryItem.warehouseId == warehouse_id,
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise ValueError(f"No inventory record for product {product_id} in warehouse {warehouse_id}")
        item.quantity += quantity
        await db.flush()
        return item

    @staticmethod
    async def get_low_stock_alerts(db: AsyncSession) -> list[InventoryItem]:
        result = await db.execute(
            select(InventoryItem).where(InventoryItem.quantity <= InventoryItem.reorderPoint)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_total_stock(db: AsyncSession, product_id: str) -> int:
        result = await db.execute(
            select(InventoryItem).where(InventoryItem.productId == product_id)
        )
        items = result.scalars().all()
        return sum(item.quantity for item in items)
