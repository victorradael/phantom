import asyncpg
from fastapi import APIRouter, Depends

from src.auth.jwt import get_tenant_id
from src.db.database import get_pool
from src.schemas.sync import LinkUpdateData, PullResponse, SyncRequest, SyncResponse
from src.services import sync_service

router = APIRouter()


def _pool() -> asyncpg.Pool:
    return get_pool()


@router.get("/", response_model=PullResponse)
async def pull_all(
    pool: asyncpg.Pool = Depends(_pool),
    tenant_id: int = Depends(get_tenant_id),
) -> PullResponse:
    return await sync_service.pull_all(pool, tenant_id)


@router.delete("/workspace/{uuid}", status_code=204)
async def delete_workspace(
    uuid: str,
    pool: asyncpg.Pool = Depends(_pool),
    tenant_id: int = Depends(get_tenant_id),
) -> None:
    await sync_service.delete_workspace(pool, uuid, tenant_id)


@router.delete("/link/{uuid}", status_code=204)
async def delete_link(
    uuid: str,
    pool: asyncpg.Pool = Depends(_pool),
    tenant_id: int = Depends(get_tenant_id),
) -> None:
    await sync_service.delete_link(pool, uuid, tenant_id)


@router.post("/", response_model=SyncResponse)
async def sync_workspace(
    request: SyncRequest,
    pool: asyncpg.Pool = Depends(_pool),
    tenant_id: int = Depends(get_tenant_id),
) -> SyncResponse:
    return await sync_service.sync_workspace(pool, request, tenant_id)


@router.patch("/link/{uuid}", status_code=204)
async def update_link(
    uuid: str,
    payload: LinkUpdateData,
    pool: asyncpg.Pool = Depends(_pool),
    tenant_id: int = Depends(get_tenant_id),
) -> None:
    await sync_service.update_link(pool, uuid, payload, tenant_id)
