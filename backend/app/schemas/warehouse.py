from datetime import datetime

from pydantic import BaseModel


class WarehouseBase(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zipCode: str
    country: str = "US"
    isActive: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zipCode: str | None = None
    country: str | None = None
    isActive: bool | None = None


class WarehouseResponse(WarehouseBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class WarehouseDetailResponse(WarehouseResponse):
    inventory: list = []
