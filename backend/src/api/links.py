from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.schemas.link import LinkCreate, LinkResponse, LinkUpdate
from src.services import link_service

router = APIRouter()


@router.post("/", response_model=LinkResponse, status_code=201)
async def create_link(
    data: LinkCreate, session: AsyncSession = Depends(get_db)
) -> LinkResponse:
    link = await link_service.create(session, data)
    return LinkResponse.model_validate(link)


@router.get("/", response_model=list[LinkResponse])
async def list_links(
    workspace_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
) -> list[LinkResponse]:
    links = await link_service.get_all(session, workspace_id=workspace_id)
    return [LinkResponse.model_validate(l) for l in links]


@router.get("/{link_id}", response_model=LinkResponse)
async def get_link(
    link_id: int, session: AsyncSession = Depends(get_db)
) -> LinkResponse:
    link = await link_service.get_by_id(session, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return LinkResponse.model_validate(link)


@router.put("/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: int, data: LinkUpdate, session: AsyncSession = Depends(get_db)
) -> LinkResponse:
    link = await link_service.get_by_id(session, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    updated = await link_service.update(session, link, data)
    return LinkResponse.model_validate(updated)


@router.delete("/{link_id}", status_code=204)
async def delete_link(
    link_id: int, session: AsyncSession = Depends(get_db)
) -> None:
    link = await link_service.get_by_id(session, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    await link_service.delete(session, link)
