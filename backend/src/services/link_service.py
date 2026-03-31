import asyncpg

from src.models.link import Link
from src.repositories import link_repo
from src.schemas.link import LinkCreate, LinkUpdate


async def get_all(
    pool: asyncpg.Pool, workspace_id: int | None = None
) -> list[Link]:
    if workspace_id is not None:
        return await link_repo.get_by_workspace(pool, workspace_id)
    return await link_repo.get_all(pool)


async def get_by_id(pool: asyncpg.Pool, link_id: int) -> Link | None:
    return await link_repo.get_by_id(pool, link_id)


async def create(pool: asyncpg.Pool, data: LinkCreate) -> Link:
    return await link_repo.create(pool, data)


async def update(
    pool: asyncpg.Pool, link_id: int, data: LinkUpdate
) -> Link | None:
    return await link_repo.update(pool, link_id, data)


async def delete(pool: asyncpg.Pool, link_id: int) -> None:
    await link_repo.delete(pool, link_id)
