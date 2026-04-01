import asyncpg
from fastapi import APIRouter, Depends

from src.db.database import get_pool
from src.schemas.sync import PullResponse, SyncRequest, SyncResponse
from src.services import sync_service

router = APIRouter()


def _pool() -> asyncpg.Pool:
    return get_pool()


@router.get("/", response_model=PullResponse)
async def pull_all(pool: asyncpg.Pool = Depends(_pool)) -> PullResponse:
    return await sync_service.pull_all(pool)


@router.delete("/workspace/{uuid}", status_code=204)
async def delete_workspace(uuid: str, pool: asyncpg.Pool = Depends(_pool)) -> None:
    await sync_service.delete_workspace(pool, uuid)


@router.delete("/link/{uuid}", status_code=204)
async def delete_link(uuid: str, pool: asyncpg.Pool = Depends(_pool)) -> None:
    await sync_service.delete_link(pool, uuid)


@router.post("/", response_model=SyncResponse)
async def sync_workspace(
    request: SyncRequest, pool: asyncpg.Pool = Depends(_pool)
) -> SyncResponse:
    return await sync_service.sync_workspace(pool, request)
