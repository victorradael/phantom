import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    name: str


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = None


class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: uuid.UUID
    created_at: datetime
    updated_at: datetime
