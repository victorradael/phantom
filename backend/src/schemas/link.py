import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LinkBase(BaseModel):
    url: str
    name: str | None = None
    description: str | None = None
    workspace_id: int


class LinkCreate(LinkBase):
    pass


class LinkUpdate(BaseModel):
    url: str | None = None
    name: str | None = None
    description: str | None = None
    workspace_id: int | None = None


class LinkResponse(LinkBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: uuid.UUID
    created_at: datetime
    updated_at: datetime
