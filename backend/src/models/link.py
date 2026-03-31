from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Link:
    id: int
    uuid: UUID
    url: str
    name: str | None
    description: str | None
    workspace_id: int
    created_at: datetime
    updated_at: datetime
