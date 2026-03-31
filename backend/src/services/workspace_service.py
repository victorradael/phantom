from sqlalchemy.ext.asyncio import AsyncSession

from src.models.workspace import Workspace
from src.repositories import workspace_repo
from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


async def get_all(session: AsyncSession) -> list[Workspace]:
    return await workspace_repo.get_all(session)


async def get_by_id(session: AsyncSession, workspace_id: int) -> Workspace | None:
    return await workspace_repo.get_by_id(session, workspace_id)


async def create(session: AsyncSession, data: WorkspaceCreate) -> Workspace:
    return await workspace_repo.create(session, data)


async def update(
    session: AsyncSession, workspace: Workspace, data: WorkspaceUpdate
) -> Workspace:
    return await workspace_repo.update(session, workspace, data)


async def delete(session: AsyncSession, workspace: Workspace) -> None:
    await workspace_repo.delete(session, workspace)
