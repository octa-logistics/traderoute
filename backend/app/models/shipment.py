import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ShipmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PICKED = "PICKED"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    RETURNED = "RETURNED"


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    orderId: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)
    warehouseId: Mapped[str] = mapped_column(String, ForeignKey("warehouses.id"), nullable=False)
    status: Mapped[ShipmentStatus] = mapped_column(Enum(ShipmentStatus), nullable=False, default=ShipmentStatus.PENDING)
    carrier: Mapped[str | None] = mapped_column(String, nullable=True)
    trackingNumber: Mapped[str | None] = mapped_column(String, nullable=True)
    estimatedDelivery: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    shippedAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    deliveredAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    order = relationship("Order", back_populates="shipments")
    warehouse = relationship("Warehouse", back_populates="shipments")
