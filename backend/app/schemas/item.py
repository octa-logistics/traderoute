from datetime import datetime

from pydantic import BaseModel

from app.schemas.category import CategoryResponse
from app.schemas.storage_location import StorageLocationResponse


class ItemProcessingLogResponse(BaseModel):
    id: str
    item_id: str
    description: str
    cost: float
    date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class ItemProcessingLogCreate(BaseModel):
    description: str
    cost: float
    date: datetime | None = None


class SaleLineItemResponse(BaseModel):
    id: str
    sale_id: str
    item_id: str
    sale_price: float

    model_config = {"from_attributes": True}


class ItemCosts(BaseModel):
    allocated_purchase_cost: float
    allocated_fees: float
    processing_cost: float
    cost_before_interest: float
    days_held: int
    financing_interest: float
    total_cost: float
    sale_price: float | None
    margin: float | None


class ItemBase(BaseModel):
    name: str
    description: str | None = None
    sku: str | None = None
    status: str = "ACQUIRED"
    category_id: str | None = None
    storage_location_id: str | None = None
    purchase_deal_id: str | None = None
    allocated_purchase_cost: float = 0
    allocated_fees: float = 0


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    sku: str | None = None
    status: str | None = None
    category_id: str | None = None
    storage_location_id: str | None = None
    purchase_deal_id: str | None = None
    allocated_purchase_cost: float | None = None
    allocated_fees: float | None = None


class ItemResponse(BaseModel):
    id: str
    name: str
    description: str | None
    sku: str | None
    status: str
    category_id: str | None
    storage_location_id: str | None
    purchase_deal_id: str | None
    organization_id: str
    allocated_purchase_cost: float
    allocated_fees: float
    created_at: datetime
    updated_at: datetime
    category: CategoryResponse | None = None
    storage_location: StorageLocationResponse | None = None
    processing_logs: list[ItemProcessingLogResponse] = []
    sale_line_item: SaleLineItemResponse | None = None

    model_config = {"from_attributes": True}


class ItemDetailResponse(ItemResponse):
    costs: ItemCosts | None = None
