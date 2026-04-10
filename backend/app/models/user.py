from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UserRole


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="UserRole", create_type=False),
        default=UserRole.MEMBER,
    )
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    organization = relationship("Organization", back_populates="users")
