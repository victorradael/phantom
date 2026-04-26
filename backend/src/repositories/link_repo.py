import asyncpg

from src.models.link import Link
from src.schemas.link import LinkCreate, LinkUpdate


def _to_link(row: asyncpg.Record) -> Link:
    return Link(
        id=row["id"],
        uuid=row["uuid"],
        url=row["url"],
        name=row["name"],
        description=row["description"],
        workspace_id=row["workspace_id"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def get_all(pool: asyncpg.Pool) -> list[Link]:
    rows = await pool.fetch("SELECT * FROM links ORDER BY id")
    return [_to_link(r) for r in rows]


async def get_by_workspace(pool: asyncpg.Pool, workspace_id: int) -> list[Link]:
    rows = await pool.fetch(
        "SELECT * FROM links WHERE workspace_id = $1 ORDER BY id", workspace_id
    )
    return [_to_link(r) for r in rows]


async def get_by_id(pool: asyncpg.Pool, link_id: int) -> Link | None:
    row = await pool.fetchrow("SELECT * FROM links WHERE id = $1", link_id)
    return _to_link(row) if row else None


async def get_by_uuid(pool: asyncpg.Pool, uuid: str) -> Link | None:
    row = await pool.fetchrow(
        "SELECT * FROM links WHERE uuid = $1::uuid", uuid
    )
    return _to_link(row) if row else None


async def create(pool: asyncpg.Pool, data: LinkCreate) -> Link:
    row = await pool.fetchrow(
        """
        INSERT INTO links (url, name, description, workspace_id)
             VALUES ($1, $2, $3, $4)
        RETURNING *
        """,
        data.url,
        data.name,
        data.description,
        data.workspace_id,
    )
    return _to_link(row)


async def update(
    pool: asyncpg.Pool, link_id: int, data: LinkUpdate
) -> Link | None:
    row = await pool.fetchrow(
        """
        UPDATE links
           SET url          = COALESCE($1, url),
               name         = COALESCE($2, name),
               description  = COALESCE($3, description),
               workspace_id = COALESCE($4, workspace_id),
               updated_at   = now()
         WHERE id = $5
        RETURNING *
        """,
        data.url,
        data.name,
        data.description,
        data.workspace_id,
        link_id,
    )
    return _to_link(row) if row else None


async def delete(pool: asyncpg.Pool, link_id: int) -> None:
    await pool.execute("DELETE FROM links WHERE id = $1", link_id)


async def delete_by_uuid(pool: asyncpg.Pool, uuid: str) -> None:
    await pool.execute("DELETE FROM links WHERE uuid = $1::uuid", uuid)


async def bulk_upsert(
    conn: asyncpg.Connection | asyncpg.Pool,
    links: list,
    workspace_id: int,
) -> None:
    if not links:
        return
    uuids = [l.uuid for l in links]
    urls = [l.url for l in links]
    names = [l.name for l in links]
    descriptions = [l.description for l in links]
    await conn.execute(
        """
        INSERT INTO links (uuid, url, name, description, workspace_id)
        SELECT d.uuid::uuid, d.url, d.name, d.description, $5
          FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
               AS d(uuid, url, name, description)
        ON CONFLICT (uuid)
          DO UPDATE SET url          = EXCLUDED.url,
                        name         = EXCLUDED.name,
                        description  = EXCLUDED.description,
                        workspace_id = EXCLUDED.workspace_id,
                        updated_at   = now()
        """,
        uuids,
        urls,
        names,
        descriptions,
        workspace_id,
    )


async def upsert_by_uuid(
    pool: asyncpg.Pool,
    uuid: str,
    url: str,
    name: str | None,
    description: str | None,
    workspace_id: int,
) -> Link:
    row = await pool.fetchrow(
        """
        INSERT INTO links (uuid, url, name, description, workspace_id)
             VALUES ($1::uuid, $2, $3, $4, $5)
        ON CONFLICT (uuid)
          DO UPDATE SET url          = EXCLUDED.url,
                        name         = EXCLUDED.name,
                        description  = EXCLUDED.description,
                        workspace_id = EXCLUDED.workspace_id,
                        updated_at   = now()
        RETURNING *
        """,
        uuid,
        url,
        name,
        description,
        workspace_id,
    )
    return _to_link(row)
