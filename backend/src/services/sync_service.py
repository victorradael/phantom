import asyncpg

from src.repositories import link_repo, workspace_repo
from src.schemas.sync import SyncRequest, SyncResponse


async def sync_workspace(pool: asyncpg.Pool, request: SyncRequest) -> SyncResponse:
    workspace = await workspace_repo.upsert_by_uuid(
        pool,
        uuid=request.workspace.uuid,
        name=request.workspace.name,
    )

    synced = 0
    for link_data in request.links:
        await link_repo.upsert_by_uuid(
            pool,
            uuid=link_data.uuid,
            url=link_data.url,
            name=link_data.name,
            description=link_data.description,
            workspace_id=workspace.id,
        )
        synced += 1

    return SyncResponse(
        workspace_id=workspace.id,
        synced_links=synced,
        message=f"Synced workspace '{workspace.name}' with {synced} link(s).",
    )
