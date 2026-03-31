from sqlalchemy.ext.asyncio import AsyncSession

from src.models.link import Link
from src.repositories import link_repo
from src.schemas.link import LinkCreate, LinkUpdate


async def get_all(session: AsyncSession, workspace_id: int | None = None) -> list[Link]:
    if workspace_id is not None:
        return await link_repo.get_by_workspace(session, workspace_id)
    return await link_repo.get_all(session)


async def get_by_id(session: AsyncSession, link_id: int) -> Link | None:
    return await link_repo.get_by_id(session, link_id)


async def create(session: AsyncSession, data: LinkCreate) -> Link:
    return await link_repo.create(session, data)


async def update(session: AsyncSession, link: Link, data: LinkUpdate) -> Link:
    return await link_repo.update(session, link, data)


async def delete(session: AsyncSession, link: Link) -> None:
    await link_repo.delete(session, link)
