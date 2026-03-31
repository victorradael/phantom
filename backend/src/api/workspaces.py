import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from src.db.database import get_pool
from src.schemas.workspace import WorkspaceCreate, WorkspaceResponse, WorkspaceUpdate
from src.services import workspace_service

router = APIRouter()


def _pool() -> asyncpg.Pool:
    return get_pool()


@router.post("/", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    data: WorkspaceCreate, pool: asyncpg.Pool = Depends(_pool)
) -> WorkspaceResponse:
    workspace = await workspace_service.create(pool, data)
    return WorkspaceResponse.model_validate(workspace.__dict__)


@router.get("/", response_model=list[WorkspaceResponse])
async def list_workspaces(
    pool: asyncpg.Pool = Depends(_pool),
) -> list[WorkspaceResponse]:
    workspaces = await workspace_service.get_all(pool)
    return [WorkspaceResponse.model_validate(w.__dict__) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int, pool: asyncpg.Pool = Depends(_pool)
) -> WorkspaceResponse:
    workspace = await workspace_service.get_by_id(pool, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceResponse.model_validate(workspace.__dict__)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    data: WorkspaceUpdate,
    pool: asyncpg.Pool = Depends(_pool),
) -> WorkspaceResponse:
    workspace = await workspace_service.update(pool, workspace_id, data)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceResponse.model_validate(workspace.__dict__)


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: int, pool: asyncpg.Pool = Depends(_pool)
) -> None:
    if not await workspace_service.get_by_id(pool, workspace_id):
        raise HTTPException(status_code=404, detail="Workspace not found")
    await workspace_service.delete(pool, workspace_id)
