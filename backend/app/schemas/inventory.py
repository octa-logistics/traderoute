from datetime import datetime

from pydantic import BaseModel


class InventoryBase(BaseModel):
    productId: str
    warehouseId: str
    quantity: int = 0
    reorderPoint: int = 0


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    quantity: int | None = None
    reorderPoint: int | None = None


class InventoryResponse(InventoryBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class InventoryDetailResponse(InventoryResponse):
    product: dict | None = None
    warehouse: dict | None = None
