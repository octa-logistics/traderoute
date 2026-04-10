from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    organization = relationship("Organization", back_populates="customers")
    sales = relationship("Sale", back_populates="customer")
