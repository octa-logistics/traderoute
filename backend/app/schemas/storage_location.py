from datetime import datetime

from pydantic import BaseModel


class StorageLocationBase(BaseModel):
    name: str
    description: str | None = None


class StorageLocationCreate(StorageLocationBase):
    pass


class StorageLocationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class StorageLocationResponse(StorageLocationBase):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
