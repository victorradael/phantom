import uuid as _uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.workspace import Workspace
from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


async def get_all(session: AsyncSession) -> list[Workspace]:
    result = await session.execute(select(Workspace).order_by(Workspace.id))
    return list(result.scalars().all())


async def get_by_id(session: AsyncSession, workspace_id: int) -> Workspace | None:
    result = await session.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    return result.scalar_one_or_none()


async def get_by_uuid(session: AsyncSession, uuid: str) -> Workspace | None:
    result = await session.execute(
        select(Workspace).where(Workspace.uuid == _uuid.UUID(uuid))
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, data: WorkspaceCreate) -> Workspace:
    workspace = Workspace(name=data.name)
    session.add(workspace)
    await session.commit()
    await session.refresh(workspace)
    return workspace


async def update(
    session: AsyncSession, workspace: Workspace, data: WorkspaceUpdate
) -> Workspace:
    if data.name is not None:
        workspace.name = data.name
    workspace.updated_at = datetime.utcnow()
    session.add(workspace)
    await session.commit()
    await session.refresh(workspace)
    return workspace


async def delete(session: AsyncSession, workspace: Workspace) -> None:
    await session.delete(workspace)
    await session.commit()


async def upsert_by_uuid(
    session: AsyncSession, uuid: str, name: str
) -> Workspace:
    existing = await get_by_uuid(session, uuid)
    if existing:
        existing.name = name
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return existing

    workspace = Workspace(uuid=_uuid.UUID(uuid), name=name)
    session.add(workspace)
    await session.commit()
    await session.refresh(workspace)
    return workspace
