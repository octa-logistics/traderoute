from sqlalchemy import JSON, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    financing_rate: Mapped[float] = mapped_column(Float, default=0, server_default="0")
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="organization", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="organization", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="organization", cascade="all, delete-orphan")
    storage_locations = relationship("StorageLocation", back_populates="organization", cascade="all, delete-orphan")
    purchase_deals = relationship("PurchaseDeal", back_populates="organization", cascade="all, delete-orphan")
    items = relationship("Item", back_populates="organization", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="organization", cascade="all, delete-orphan")
