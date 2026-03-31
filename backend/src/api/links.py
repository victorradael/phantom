import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query

from src.db.database import get_pool
from src.schemas.link import LinkCreate, LinkResponse, LinkUpdate
from src.services import link_service

router = APIRouter()


def _pool() -> asyncpg.Pool:
    return get_pool()


@router.post("/", response_model=LinkResponse, status_code=201)
async def create_link(
    data: LinkCreate, pool: asyncpg.Pool = Depends(_pool)
) -> LinkResponse:
    link = await link_service.create(pool, data)
    return LinkResponse.model_validate(link.__dict__)


@router.get("/", response_model=list[LinkResponse])
async def list_links(
    workspace_id: int | None = Query(default=None),
    pool: asyncpg.Pool = Depends(_pool),
) -> list[LinkResponse]:
    links = await link_service.get_all(pool, workspace_id=workspace_id)
    return [LinkResponse.model_validate(l.__dict__) for l in links]


@router.get("/{link_id}", response_model=LinkResponse)
async def get_link(
    link_id: int, pool: asyncpg.Pool = Depends(_pool)
) -> LinkResponse:
    link = await link_service.get_by_id(pool, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return LinkResponse.model_validate(link.__dict__)


@router.put("/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: int, data: LinkUpdate, pool: asyncpg.Pool = Depends(_pool)
) -> LinkResponse:
    link = await link_service.update(pool, link_id, data)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return LinkResponse.model_validate(link.__dict__)


@router.delete("/{link_id}", status_code=204)
async def delete_link(
    link_id: int, pool: asyncpg.Pool = Depends(_pool)
) -> None:
    if not await link_service.get_by_id(pool, link_id):
        raise HTTPException(status_code=404, detail="Link not found")
    await link_service.delete(pool, link_id)
