from pydantic import BaseModel


class WorkspaceSyncData(BaseModel):
    uuid: str
    name: str


class TagData(BaseModel):
    uuid: str
    name: str


class LinkSyncData(BaseModel):
    uuid: str
    url: str
    name: str | None = None
    description: str | None = None
    tags: list[TagData] = []


class LinkUpdateData(BaseModel):
    workspace_uuid: str | None = None
    url: str | None = None
    name: str | None = None
    tags: list[TagData] | None = None


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
    tags: list[TagData] = []


class PullResponse(BaseModel):
    workspaces: list[PullWorkspaceData]
    links: list[PullLinkData]
