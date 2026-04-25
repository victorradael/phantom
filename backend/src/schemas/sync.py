from pydantic import BaseModel


class WorkspaceSyncData(BaseModel):
    uuid: str
    name: str


class LinkSyncData(BaseModel):
    uuid: str
    url: str
    name: str | None = None
    description: str | None = None


class LinkUpdateData(BaseModel):
    workspace_uuid: str


class SyncRequest(BaseModel):
    workspace: WorkspaceSyncData
    links: list[LinkSyncData]


class SyncResponse(BaseModel):
    workspace_id: int
    synced_links: int
    message: str


class PullWorkspaceData(BaseModel):
    uuid: str
    name: str


class PullLinkData(BaseModel):
    uuid: str
    url: str
    name: str | None = None
    description: str | None = None
    workspace_uuid: str


class PullResponse(BaseModel):
    workspaces: list[PullWorkspaceData]
    links: list[PullLinkData]
