from datetime import datetime

from pydantic import BaseModel


class ProductBase(BaseModel):
    sku: str
    name: str
    description: str | None = None
    weight: float | None = None
    weightUnit: str = "lb"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: str | None = None
    name: str | None = None
    description: str | None = None
    weight: float | None = None
    weightUnit: str | None = None


class ProductResponse(ProductBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductResponse):
    inventory: list = []
