from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderItemBase(BaseModel):
    productId: str
    quantity: int
    unitPrice: float


class OrderItemResponse(OrderItemBase):
    id: str
    product: dict | None = None

    model_config = {"from_attributes": True}


class OrderBase(BaseModel):
    orderNumber: str
    status: OrderStatus = OrderStatus.PENDING
    customerName: str
    customerEmail: str
    shippingAddress: str
    city: str
    state: str
    zipCode: str
    country: str = "US"


class OrderCreate(OrderBase):
    items: list[OrderItemBase] = []


class OrderUpdate(BaseModel):
    status: OrderStatus | None = None
    customerName: str | None = None
    customerEmail: str | None = None
    shippingAddress: str | None = None
    city: str | None = None
    state: str | None = None
    zipCode: str | None = None
    country: str | None = None


class OrderResponse(OrderBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class OrderDetailResponse(OrderResponse):
    items: list[OrderItemResponse] = []
    shipments: list = []
