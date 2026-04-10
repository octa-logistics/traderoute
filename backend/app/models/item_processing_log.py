from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ItemProcessingLog(Base):
    __tablename__ = "item_processing_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    item_id: Mapped[str] = mapped_column(
        String, ForeignKey("items.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(String, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    item = relationship("Item", back_populates="processing_logs")
