from datetime import datetime

from pydantic import BaseModel

from app.schemas.customer import CustomerResponse
from app.schemas.item import SaleLineItemResponse


class SaleLineItemCreate(BaseModel):
    item_id: str
    sale_price: float


class SaleCreate(BaseModel):
    customer_id: str
    date: datetime | None = None
    notes: str | None = None
    line_items: list[SaleLineItemCreate]


class SaleUpdate(BaseModel):
    customer_id: str | None = None
    date: datetime | None = None
    notes: str | None = None


class SaleResponse(BaseModel):
    id: str
    customer_id: str
    organization_id: str
    date: datetime
    notes: str | None
    created_at: datetime
    updated_at: datetime
    customer: CustomerResponse | None = None
    line_items: list[SaleLineItemResponse] = []

    model_config = {"from_attributes": True}
