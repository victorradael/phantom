from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Tag:
    id: int
    uuid: UUID
    name: str
    workspace_id: int
    created_at: datetime
    updated_at: datetime
