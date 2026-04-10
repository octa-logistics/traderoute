from sqlalchemy import Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, ItemStatus, TimestampMixin


class Item(TimestampMixin, Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus, name="ItemStatus", create_type=False),
        default=ItemStatus.ACQUIRED,
    )
    category_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    storage_location_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("storage_locations.id", ondelete="SET NULL"), nullable=True
    )
    purchase_deal_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("purchase_deals.id", ondelete="SET NULL"), nullable=True
    )
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    allocated_purchase_cost: Mapped[float] = mapped_column(Float, default=0, server_default="0")
    allocated_fees: Mapped[float] = mapped_column(Float, default=0, server_default="0")

    category = relationship("Category", back_populates="items")
    storage_location = relationship("StorageLocation", back_populates="items")
    purchase_deal = relationship("PurchaseDeal", back_populates="items")
    organization = relationship("Organization", back_populates="items")
    processing_logs = relationship("ItemProcessingLog", back_populates="item", cascade="all, delete-orphan")
    sale_line_item = relationship("SaleLineItem", back_populates="item", uselist=False)
