from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    productId: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    warehouseId: Mapped[str] = mapped_column(String, ForeignKey("warehouses.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorderPoint: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    createdAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="inventory")
    warehouse = relationship("Warehouse", back_populates="inventory")

    __table_args__ = (UniqueConstraint("productId", "warehouseId"),)
