import asyncpg

from src.models.workspace import Workspace
from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


def _to_workspace(row: asyncpg.Record) -> Workspace:
    return Workspace(
        id=row["id"],
        uuid=row["uuid"],
        name=row["name"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def get_all(pool: asyncpg.Pool, tenant_id: int) -> list[Workspace]:
    rows = await pool.fetch(
        "SELECT * FROM workspaces WHERE tenant_id = $1 ORDER BY id", tenant_id
    )
    return [_to_workspace(r) for r in rows]


async def get_by_id(
    pool: asyncpg.Pool, workspace_id: int, tenant_id: int
) -> Workspace | None:
    row = await pool.fetchrow(
        "SELECT * FROM workspaces WHERE id = $1 AND tenant_id = $2",
        workspace_id,
        tenant_id,
    )
    return _to_workspace(row) if row else None


async def get_by_uuid(
    pool: asyncpg.Pool, uuid: str, tenant_id: int
) -> Workspace | None:
    row = await pool.fetchrow(
        "SELECT * FROM workspaces WHERE uuid = $1::uuid AND tenant_id = $2",
        uuid,
        tenant_id,
    )
    return _to_workspace(row) if row else None


async def create(
    pool: asyncpg.Pool, data: WorkspaceCreate, tenant_id: int
) -> Workspace:
    row = await pool.fetchrow(
        "INSERT INTO workspaces (name, tenant_id) VALUES ($1, $2) RETURNING *",
        data.name,
        tenant_id,
    )
    return _to_workspace(row)


async def update(
    pool: asyncpg.Pool, workspace_id: int, data: WorkspaceUpdate, tenant_id: int
) -> Workspace | None:
    row = await pool.fetchrow(
        """
        UPDATE workspaces
           SET name       = COALESCE($1, name),
               updated_at = now()
         WHERE id = $2 AND tenant_id = $3
        RETURNING *
        """,
        data.name,
        workspace_id,
        tenant_id,
    )
    return _to_workspace(row) if row else None


async def delete(pool: asyncpg.Pool, workspace_id: int, tenant_id: int) -> None:
    await pool.execute(
        "DELETE FROM workspaces WHERE id = $1 AND tenant_id = $2",
        workspace_id,
        tenant_id,
    )


async def delete_by_uuid(pool: asyncpg.Pool, uuid: str, tenant_id: int) -> None:
    await pool.execute(
        "DELETE FROM workspaces WHERE uuid = $1::uuid AND tenant_id = $2",
        uuid,
        tenant_id,
    )


async def upsert_by_uuid(
    conn: asyncpg.Connection | asyncpg.Pool,
    uuid: str,
    name: str,
    tenant_id: int,
) -> Workspace:
    row = await conn.fetchrow(
        """
        INSERT INTO workspaces (uuid, name, tenant_id)
             VALUES ($1::uuid, $2, $3)
        ON CONFLICT (uuid, tenant_id)
          DO UPDATE SET name = EXCLUDED.name, updated_at = now()
        RETURNING *
        """,
        uuid,
        name,
        tenant_id,
    )
    return _to_workspace(row)
