import asyncpg

from src.repositories import link_repo, workspace_repo
from src.schemas.sync import PullLinkData, PullResponse, PullWorkspaceData, SyncRequest, SyncResponse


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


async def delete_workspace(pool: asyncpg.Pool, uuid: str) -> None:
    await workspace_repo.delete_by_uuid(pool, uuid)


async def delete_link(pool: asyncpg.Pool, uuid: str) -> None:
    await link_repo.delete_by_uuid(pool, uuid)


async def pull_all(pool: asyncpg.Pool) -> PullResponse:
    workspaces = await workspace_repo.get_all(pool)

    rows = await pool.fetch(
        """
        SELECT l.uuid, l.url, l.name, l.description, w.uuid AS workspace_uuid
          FROM links l
          JOIN workspaces w ON l.workspace_id = w.id
         ORDER BY l.id
        """
    )

    return PullResponse(
        workspaces=[PullWorkspaceData(uuid=str(w.uuid), name=w.name) for w in workspaces],
        links=[
            PullLinkData(
                uuid=str(r["uuid"]),
                url=r["url"],
                name=r["name"],
                description=r["description"],
                workspace_uuid=str(r["workspace_uuid"]),
            )
            for r in rows
        ],
    )
