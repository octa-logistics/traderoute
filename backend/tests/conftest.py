"""Shared test fixtures — async SQLite database, test client, auth helpers."""

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.dependencies import get_current_org_id, get_current_user
from app.core.security import create_access_token
from app.main import app
from app.models.base import Base, ItemStatus
from app.models.category import Category
from app.models.customer import Customer
from app.models.item import Item
from app.models.item_processing_log import ItemProcessingLog
from app.models.organization import Organization
from app.models.sale import Sale
from app.models.sale_line_item import SaleLineItem
from app.models.user import User
from app.models.vendor import Vendor


# Use SQLite for tests — StaticPool shares a single connection for in-memory DB.
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DB_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test and drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    """Provide a test database session."""
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture
async def seed_data(db: AsyncSession):
    """Seed org, user, customer, category, and a few items for tests."""
    org_id = str(uuid4())
    user_id = str(uuid4())
    customer_id = str(uuid4())
    category_id = str(uuid4())

    org = Organization(
        id=org_id,
        name="Test Org",
        financing_rate=0.12,  # 12% annual
    )
    user = User(
        id=user_id,
        email="test@example.com",
        name="Test User",
        password_hash="not-a-real-hash",  # Auth is overridden in tests
        organization_id=org_id,
    )
    customer = Customer(
        id=customer_id,
        name="Test Customer",
        organization_id=org_id,
    )
    category = Category(
        id=category_id,
        name="Electronics",
        organization_id=org_id,
    )

    db.add_all([org, user, customer, category])
    await db.commit()

    return {
        "org_id": org_id,
        "user_id": user_id,
        "customer_id": customer_id,
        "category_id": category_id,
        "user": user,
    }


@pytest_asyncio.fixture
async def client(db: AsyncSession, seed_data: dict):
    """Async HTTP test client with auth and DB overrides."""
    user = seed_data["user"]

    async def override_get_db():
        yield db

    async def override_get_current_user():
        return user

    async def override_get_current_org_id():
        return user.organization_id

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_org_id] = override_get_current_org_id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
