from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Sale(TimestampMixin, Base):
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    customer = relationship("Customer", back_populates="sales")
    organization = relationship("Organization", back_populates="sales")
    line_items = relationship("SaleLineItem", back_populates="sale", cascade="all, delete-orphan")
