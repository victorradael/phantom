import asyncpg

from src.models.link import Link
from src.repositories import link_repo
from src.schemas.link import LinkCreate, LinkUpdate


async def get_all(
    pool: asyncpg.Pool, tenant_id: int, workspace_id: int | None = None
) -> list[Link]:
    if workspace_id is not None:
        return await link_repo.get_by_workspace(pool, workspace_id, tenant_id)
    return await link_repo.get_all(pool, tenant_id)


async def get_by_id(
    pool: asyncpg.Pool, link_id: int, tenant_id: int
) -> Link | None:
    return await link_repo.get_by_id(pool, link_id, tenant_id)


async def create(pool: asyncpg.Pool, data: LinkCreate, tenant_id: int) -> Link:
    return await link_repo.create(pool, data, tenant_id)


async def update(
    pool: asyncpg.Pool, link_id: int, data: LinkUpdate, tenant_id: int
) -> Link | None:
    return await link_repo.update(pool, link_id, data, tenant_id)


async def delete(pool: asyncpg.Pool, link_id: int, tenant_id: int) -> None:
    await link_repo.delete(pool, link_id, tenant_id)
