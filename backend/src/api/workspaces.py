from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.schemas.workspace import WorkspaceCreate, WorkspaceResponse, WorkspaceUpdate
from src.services import workspace_service

router = APIRouter()


@router.post("/", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    data: WorkspaceCreate, session: AsyncSession = Depends(get_db)
) -> WorkspaceResponse:
    workspace = await workspace_service.create(session, data)
    return WorkspaceResponse.model_validate(workspace)


@router.get("/", response_model=list[WorkspaceResponse])
async def list_workspaces(
    session: AsyncSession = Depends(get_db),
) -> list[WorkspaceResponse]:
    workspaces = await workspace_service.get_all(session)
    return [WorkspaceResponse.model_validate(w) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int, session: AsyncSession = Depends(get_db)
) -> WorkspaceResponse:
    workspace = await workspace_service.get_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceResponse.model_validate(workspace)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    data: WorkspaceUpdate,
    session: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    workspace = await workspace_service.get_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    updated = await workspace_service.update(session, workspace, data)
    return WorkspaceResponse.model_validate(updated)


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: int, session: AsyncSession = Depends(get_db)
) -> None:
    workspace = await workspace_service.get_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    await workspace_service.delete(session, workspace)
