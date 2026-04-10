from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class PurchaseDeal(TimestampMixin, Base):
    __tablename__ = "purchase_deals"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    vendor_id: Mapped[str] = mapped_column(String, ForeignKey("vendors.id"), nullable=False)
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    fees: Mapped[float] = mapped_column(Float, default=0, server_default="0")
    taxes: Mapped[float] = mapped_column(Float, default=0, server_default="0")
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    vendor = relationship("Vendor", back_populates="purchase_deals")
    organization = relationship("Organization", back_populates="purchase_deals")
    items = relationship("Item", back_populates="purchase_deal")
