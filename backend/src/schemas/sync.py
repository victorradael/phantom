from pydantic import BaseModel


class WorkspaceSyncData(BaseModel):
    uuid: str
    name: str


class LinkSyncData(BaseModel):
    uuid: str
    url: str
    name: str | None = None
    description: str | None = None


class SyncRequest(BaseModel):
    workspace: WorkspaceSyncData
    links: list[LinkSyncData]


class SyncResponse(BaseModel):
    workspace_id: int
    synced_links: int
    message: str
