from datetime import datetime

from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    notes: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    notes: str | None = None


class CustomerResponse(CustomerBase):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
