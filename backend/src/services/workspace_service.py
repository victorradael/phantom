import asyncpg

from src.models.workspace import Workspace
from src.repositories import workspace_repo
from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


async def get_all(pool: asyncpg.Pool, tenant_id: int) -> list[Workspace]:
    return await workspace_repo.get_all(pool, tenant_id)


async def get_by_id(
    pool: asyncpg.Pool, workspace_id: int, tenant_id: int
) -> Workspace | None:
    return await workspace_repo.get_by_id(pool, workspace_id, tenant_id)


async def create(
    pool: asyncpg.Pool, data: WorkspaceCreate, tenant_id: int
) -> Workspace:
    return await workspace_repo.create(pool, data, tenant_id)


async def update(
    pool: asyncpg.Pool, workspace_id: int, data: WorkspaceUpdate, tenant_id: int
) -> Workspace | None:
    return await workspace_repo.update(pool, workspace_id, data, tenant_id)


async def delete(pool: asyncpg.Pool, workspace_id: int, tenant_id: int) -> None:
    await workspace_repo.delete(pool, workspace_id, tenant_id)
