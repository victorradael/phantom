import asyncpg

from src.models.workspace import Workspace
from src.repositories import workspace_repo
from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


async def get_all(pool: asyncpg.Pool) -> list[Workspace]:
    return await workspace_repo.get_all(pool)


async def get_by_id(pool: asyncpg.Pool, workspace_id: int) -> Workspace | None:
    return await workspace_repo.get_by_id(pool, workspace_id)


async def create(pool: asyncpg.Pool, data: WorkspaceCreate) -> Workspace:
    return await workspace_repo.create(pool, data)


async def update(
    pool: asyncpg.Pool, workspace_id: int, data: WorkspaceUpdate
) -> Workspace | None:
    return await workspace_repo.update(pool, workspace_id, data)


async def delete(pool: asyncpg.Pool, workspace_id: int) -> None:
    await workspace_repo.delete(pool, workspace_id)
