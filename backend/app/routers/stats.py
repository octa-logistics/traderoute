from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.warehouse import Warehouse
from app.models.product import Product
from app.models.order import Order
from app.models.shipment import Shipment

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    warehouses = (await db.execute(select(func.count()).select_from(Warehouse))).scalar()
    products = (await db.execute(select(func.count()).select_from(Product))).scalar()
    orders = (await db.execute(select(func.count()).select_from(Order))).scalar()
    shipments = (await db.execute(select(func.count()).select_from(Shipment))).scalar()

    return {
        "warehouses": warehouses,
        "products": products,
        "orders": orders,
        "shipments": shipments,
    }
