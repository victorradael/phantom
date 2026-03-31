import uuid as _uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.link import Link
from src.schemas.link import LinkCreate, LinkUpdate


async def get_all(session: AsyncSession) -> list[Link]:
    result = await session.execute(select(Link).order_by(Link.id))
    return list(result.scalars().all())


async def get_by_workspace(session: AsyncSession, workspace_id: int) -> list[Link]:
    result = await session.execute(
        select(Link).where(Link.workspace_id == workspace_id).order_by(Link.id)
    )
    return list(result.scalars().all())


async def get_by_id(session: AsyncSession, link_id: int) -> Link | None:
    result = await session.execute(select(Link).where(Link.id == link_id))
    return result.scalar_one_or_none()


async def get_by_uuid(session: AsyncSession, uuid: str) -> Link | None:
    result = await session.execute(
        select(Link).where(Link.uuid == _uuid.UUID(uuid))
    )
    return result.scalar_one_or_none()


async def create(session: AsyncSession, data: LinkCreate) -> Link:
    link = Link(
        url=data.url,
        name=data.name,
        description=data.description,
        workspace_id=data.workspace_id,
    )
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link


async def update(session: AsyncSession, link: Link, data: LinkUpdate) -> Link:
    if data.url is not None:
        link.url = data.url
    if data.name is not None:
        link.name = data.name
    if data.description is not None:
        link.description = data.description
    if data.workspace_id is not None:
        link.workspace_id = data.workspace_id
    link.updated_at = datetime.utcnow()
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link


async def delete(session: AsyncSession, link: Link) -> None:
    await session.delete(link)
    await session.commit()


async def upsert_by_uuid(
    session: AsyncSession,
    uuid: str,
    url: str,
    name: str | None,
    description: str | None,
    workspace_id: int,
) -> Link:
    existing = await get_by_uuid(session, uuid)
    if existing:
        existing.url = url
        existing.name = name
        existing.description = description
        existing.workspace_id = workspace_id
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return existing

    link = Link(
        uuid=_uuid.UUID(uuid),
        url=url,
        name=name,
        description=description,
        workspace_id=workspace_id,
    )
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link
