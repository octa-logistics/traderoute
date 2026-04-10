from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class StorageLocation(TimestampMixin, Base):
    __tablename__ = "storage_locations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    organization = relationship("Organization", back_populates="storage_locations")
    items = relationship("Item", back_populates="storage_location")
