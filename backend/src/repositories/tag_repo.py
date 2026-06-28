import asyncpg


async def upsert_for_workspace(
    conn: asyncpg.Connection,
    tags: list,
    workspace_id: int,
) -> dict[str, int]:
    """Upsert tags scoped to a workspace. Returns {uuid: id}."""
    if not tags:
        return {}
    result = {}
    for tag in tags:
        row = await conn.fetchrow(
            """
            INSERT INTO tags (uuid, name, workspace_id)
            VALUES ($1::uuid, $2, $3)
            ON CONFLICT (uuid) DO UPDATE
                SET name       = EXCLUDED.name,
                    updated_at = now()
            RETURNING id
            """,
            tag.uuid,
            tag.name,
            workspace_id,
        )
        result[tag.uuid] = row["id"]
    return result


async def set_link_tags(
    conn: asyncpg.Connection,
    link_id: int,
    tag_ids: list[int],
) -> None:
    """Replace all tag associations for a link (full replace per sync)."""
    await conn.execute("DELETE FROM link_tags WHERE link_id = $1", link_id)
    if tag_ids:
        await conn.executemany(
            "INSERT INTO link_tags (link_id, tag_id) VALUES ($1, $2)",
            [(link_id, tid) for tid in tag_ids],
        )


async def get_tags_for_links(
    conn: asyncpg.Connection | asyncpg.Pool,
    link_ids: list[int],
) -> dict[int, list[dict]]:
    """Return {link_id: [{uuid, name}]} for the given link ids."""
    if not link_ids:
        return {}
    rows = await conn.fetch(
        """
        SELECT lt.link_id, t.uuid::text AS uuid, t.name
          FROM link_tags lt
          JOIN tags t ON t.id = lt.tag_id
         WHERE lt.link_id = ANY($1::int[])
        """,
        link_ids,
    )
    result: dict[int, list[dict]] = {}
    for row in rows:
        lid = row["link_id"]
        result.setdefault(lid, []).append({"uuid": row["uuid"], "name": row["name"]})
    return result
