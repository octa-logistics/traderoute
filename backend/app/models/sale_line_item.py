from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SaleLineItem(Base):
    __tablename__ = "sale_line_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    sale_id: Mapped[str] = mapped_column(
        String, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False
    )
    item_id: Mapped[str] = mapped_column(String, ForeignKey("items.id"), unique=True, nullable=False)
    sale_price: Mapped[float] = mapped_column(Float, nullable=False)

    sale = relationship("Sale", back_populates="line_items")
    item = relationship("Item", back_populates="sale_line_item")
