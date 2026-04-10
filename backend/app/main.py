from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    auth,
    categories,
    customers,
    dashboard,
    items,
    purchase_deals,
    sales,
    storage_locations,
    vendors,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="TradeRoute API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vendors.router)
app.include_router(customers.router)
app.include_router(categories.router)
app.include_router(storage_locations.router)
app.include_router(purchase_deals.router)
app.include_router(items.router)
app.include_router(sales.router)
app.include_router(dashboard.router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
