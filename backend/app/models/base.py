import enum

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class ItemStatus(str, enum.Enum):
    ACQUIRED = "ACQUIRED"
    PROCESSING = "PROCESSING"
    LISTED = "LISTED"
    SOLD = "SOLD"
    RETURNED = "RETURNED"


class TimestampMixin:
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
