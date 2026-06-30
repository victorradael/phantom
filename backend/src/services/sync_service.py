import asyncio

import asyncpg
from fastapi import HTTPException

from src.repositories import link_repo, workspace_repo, tag_repo
from src.schemas.sync import (
    LinkUpdateData,
    PullLinkData,
    PullResponse,
    PullWorkspaceData,
    SyncRequest,
    SyncResponse,
    TagData,
)


async def sync_workspace(
    pool: asyncpg.Pool, request: SyncRequest, tenant_id: int
) -> SyncResponse:
    async with pool.acquire() as conn:
        async with conn.transaction():
            workspace = await workspace_repo.upsert_by_uuid(
                conn,
                uuid=request.workspace.uuid,
                name=request.workspace.name,
                tenant_id=tenant_id,
            )
            await link_repo.bulk_upsert(conn, request.links, workspace.id, tenant_id)

            for link_data in request.links:
                if not link_data.tags:
                    link_row = await conn.fetchrow(
                        "SELECT id FROM links WHERE uuid = $1::uuid AND tenant_id = $2",
                        link_data.uuid,
                        tenant_id,
                    )
                    if link_row:
                        await tag_repo.set_link_tags(conn, link_row["id"], [])
                    continue

                link_row = await conn.fetchrow(
                    "SELECT id FROM links WHERE uuid = $1::uuid AND tenant_id = $2",
                    link_data.uuid,
                    tenant_id,
                )
                if not link_row:
                    continue

                tag_uuid_to_id = await tag_repo.upsert_for_workspace(
                    conn, link_data.tags, workspace.id, tenant_id
                )
                await tag_repo.set_link_tags(
                    conn, link_row["id"], list(tag_uuid_to_id.values())
                )

    return SyncResponse(
        workspace_id=workspace.id,
        synced_links=len(request.links),
        message=f"Synced workspace '{workspace.name}' with {len(request.links)} link(s).",
    )


async def delete_workspace(pool: asyncpg.Pool, uuid: str, tenant_id: int) -> None:
    await workspace_repo.delete_by_uuid(pool, uuid, tenant_id)


async def delete_link(pool: asyncpg.Pool, uuid: str, tenant_id: int) -> None:
    await link_repo.delete_by_uuid(pool, uuid, tenant_id)


async def pull_all(pool: asyncpg.Pool, tenant_id: int) -> PullResponse:
    workspace_rows, link_rows = await asyncio.gather(
        pool.fetch(
            "SELECT uuid, name FROM workspaces WHERE tenant_id = $1 ORDER BY id",
            tenant_id,
        ),
        pool.fetch(
            """
            SELECT l.id, l.uuid, l.url, l.name, l.description, w.uuid AS workspace_uuid
              FROM links l
              JOIN workspaces w ON l.workspace_id = w.id
             WHERE l.tenant_id = $1
             ORDER BY l.id
            """,
            tenant_id,
        ),
    )

    link_ids = [r["id"] for r in link_rows]
    tags_by_link = await tag_repo.get_tags_for_links(pool, link_ids)

    return PullResponse(
        workspaces=[
            PullWorkspaceData(uuid=str(r["uuid"]), name=r["name"])
            for r in workspace_rows
        ],
        links=[
            PullLinkData(
                uuid=str(r["uuid"]),
                url=r["url"],
                name=r["name"],
                description=r["description"],
                workspace_uuid=str(r["workspace_uuid"]),
                tags=[
                    TagData(uuid=t["uuid"], name=t["name"])
                    for t in tags_by_link.get(r["id"], [])
                ],
            )
            for r in link_rows
        ],
    )


async def update_link(
    pool: asyncpg.Pool, uuid: str, data: LinkUpdateData, tenant_id: int
) -> None:
    set_clauses: list[str] = []
    params: list = []

    if data.workspace_uuid is not None:
        workspace = await workspace_repo.get_by_uuid(pool, data.workspace_uuid, tenant_id)
        if not workspace:
            raise HTTPException(
                status_code=404,
                detail=f"Workspace {data.workspace_uuid} not found",
            )
        set_clauses.append(f"workspace_id = ${len(params) + 1}")
        params.append(workspace.id)

    if data.url is not None:
        set_clauses.append(f"url = ${len(params) + 1}")
        params.append(data.url)

    if data.name is not None:
        set_clauses.append(f"name = ${len(params) + 1}")
        params.append(data.name)

    if set_clauses:
        set_clauses.append("updated_at = now()")
        params.extend([uuid, tenant_id])
        await pool.execute(
            f"UPDATE links SET {', '.join(set_clauses)}"
            f" WHERE uuid = ${len(params) - 1}::uuid AND tenant_id = ${len(params)}",
            *params,
        )

    if data.tags is not None:
        link_row = await pool.fetchrow(
            "SELECT id, workspace_id FROM links WHERE uuid = $1::uuid AND tenant_id = $2",
            uuid,
            tenant_id,
        )
        if link_row:
            async with pool.acquire() as conn:
                async with conn.transaction():
                    tag_uuid_to_id = await tag_repo.upsert_for_workspace(
                        conn, data.tags, link_row["workspace_id"], tenant_id
                    )
                    await tag_repo.set_link_tags(
                        conn, link_row["id"], list(tag_uuid_to_id.values())
                    )
