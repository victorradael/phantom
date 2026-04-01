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


async def get_all(pool: asyncpg.Pool) -> list[Workspace]:
    rows = await pool.fetch("SELECT * FROM workspaces ORDER BY id")
    return [_to_workspace(r) for r in rows]


async def get_by_id(pool: asyncpg.Pool, workspace_id: int) -> Workspace | None:
    row = await pool.fetchrow(
        "SELECT * FROM workspaces WHERE id = $1", workspace_id
    )
    return _to_workspace(row) if row else None


async def get_by_uuid(pool: asyncpg.Pool, uuid: str) -> Workspace | None:
    row = await pool.fetchrow(
        "SELECT * FROM workspaces WHERE uuid = $1::uuid", uuid
    )
    return _to_workspace(row) if row else None


async def create(pool: asyncpg.Pool, data: WorkspaceCreate) -> Workspace:
    row = await pool.fetchrow(
        "INSERT INTO workspaces (name) VALUES ($1) RETURNING *",
        data.name,
    )
    return _to_workspace(row)


async def update(
    pool: asyncpg.Pool, workspace_id: int, data: WorkspaceUpdate
) -> Workspace | None:
    row = await pool.fetchrow(
        """
        UPDATE workspaces
           SET name       = COALESCE($1, name),
               updated_at = now()
         WHERE id = $2
        RETURNING *
        """,
        data.name,
        workspace_id,
    )
    return _to_workspace(row) if row else None


async def delete(pool: asyncpg.Pool, workspace_id: int) -> None:
    await pool.execute("DELETE FROM workspaces WHERE id = $1", workspace_id)


async def delete_by_uuid(pool: asyncpg.Pool, uuid: str) -> None:
    await pool.execute("DELETE FROM workspaces WHERE uuid = $1::uuid", uuid)


async def upsert_by_uuid(
    pool: asyncpg.Pool, uuid: str, name: str
) -> Workspace:
    row = await pool.fetchrow(
        """
        INSERT INTO workspaces (uuid, name)
             VALUES ($1::uuid, $2)
        ON CONFLICT (uuid)
          DO UPDATE SET name = EXCLUDED.name, updated_at = now()
        RETURNING *
        """,
        uuid,
        name,
    )
    return _to_workspace(row)
