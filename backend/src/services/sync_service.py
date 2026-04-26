import asyncio

import asyncpg
from fastapi import HTTPException

from src.repositories import link_repo, workspace_repo
from src.schemas.sync import LinkUpdateData, PullLinkData, PullResponse, PullWorkspaceData, SyncRequest, SyncResponse


async def sync_workspace(pool: asyncpg.Pool, request: SyncRequest) -> SyncResponse:
    async with pool.acquire() as conn:
        async with conn.transaction():
            workspace = await workspace_repo.upsert_by_uuid(
                conn,
                uuid=request.workspace.uuid,
                name=request.workspace.name,
            )
            await link_repo.bulk_upsert(conn, request.links, workspace.id)

    return SyncResponse(
        workspace_id=workspace.id,
        synced_links=len(request.links),
        message=f"Synced workspace '{workspace.name}' with {len(request.links)} link(s).",
    )


async def delete_workspace(pool: asyncpg.Pool, uuid: str) -> None:
    await workspace_repo.delete_by_uuid(pool, uuid)


async def delete_link(pool: asyncpg.Pool, uuid: str) -> None:
    await link_repo.delete_by_uuid(pool, uuid)


async def pull_all(pool: asyncpg.Pool) -> PullResponse:
    workspace_rows, link_rows = await asyncio.gather(
        pool.fetch("SELECT uuid, name FROM workspaces ORDER BY id"),
        pool.fetch(
            """
            SELECT l.uuid, l.url, l.name, l.description, w.uuid AS workspace_uuid
              FROM links l
              JOIN workspaces w ON l.workspace_id = w.id
             ORDER BY l.id
            """
        ),
    )

    return PullResponse(
        workspaces=[PullWorkspaceData(uuid=str(r["uuid"]), name=r["name"]) for r in workspace_rows],
        links=[
            PullLinkData(
                uuid=str(r["uuid"]),
                url=r["url"],
                name=r["name"],
                description=r["description"],
                workspace_uuid=str(r["workspace_uuid"]),
            )
            for r in link_rows
        ],
    )


async def update_link(pool: asyncpg.Pool, uuid: str, data: LinkUpdateData) -> None:
    workspace = await workspace_repo.get_by_uuid(pool, data.workspace_uuid)
    if not workspace:
        raise HTTPException(status_code=404, detail=f"Workspace {data.workspace_uuid} not found")

    await pool.execute(
        """
        UPDATE links
           SET workspace_id = $1,
               updated_at   = now()
         WHERE uuid = $2::uuid
        """,
        workspace.id,
        uuid,
    )
