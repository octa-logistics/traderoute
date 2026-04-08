from datetime import datetime

from pydantic import BaseModel

from app.models.shipment import ShipmentStatus


class ShipmentBase(BaseModel):
    orderId: str
    warehouseId: str
    status: ShipmentStatus = ShipmentStatus.PENDING
    carrier: str | None = None
    trackingNumber: str | None = None
    estimatedDelivery: datetime | None = None
    shippedAt: datetime | None = None
    deliveredAt: datetime | None = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    status: ShipmentStatus | None = None
    carrier: str | None = None
    trackingNumber: str | None = None
    estimatedDelivery: datetime | None = None
    shippedAt: datetime | None = None
    deliveredAt: datetime | None = None


class ShipmentResponse(ShipmentBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class ShipmentDetailResponse(ShipmentResponse):
    order: dict | None = None
    warehouse: dict | None = None
