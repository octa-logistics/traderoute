from datetime import datetime

from pydantic import BaseModel

from app.schemas.vendor import VendorResponse


class PurchaseDealBase(BaseModel):
    vendor_id: str
    total_price: float
    fees: float = 0
    taxes: float = 0
    date: datetime | None = None
    notes: str | None = None


class PurchaseDealCreate(PurchaseDealBase):
    pass


class PurchaseDealUpdate(BaseModel):
    vendor_id: str | None = None
    total_price: float | None = None
    fees: float | None = None
    taxes: float | None = None
    date: datetime | None = None
    notes: str | None = None


class PurchaseDealResponse(BaseModel):
    id: str
    vendor_id: str
    organization_id: str
    date: datetime
    total_price: float
    fees: float
    taxes: float
    notes: str | None
    created_at: datetime
    updated_at: datetime
    vendor: VendorResponse | None = None

    model_config = {"from_attributes": True}
