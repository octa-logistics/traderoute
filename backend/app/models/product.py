from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    sku: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    weightUnit: Mapped[str] = mapped_column(String, nullable=False, default="lb")
    createdAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updatedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    inventory = relationship("InventoryItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
