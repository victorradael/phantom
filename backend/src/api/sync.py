from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.schemas.sync import SyncRequest, SyncResponse
from src.services import sync_service

router = APIRouter()


@router.post("/", response_model=SyncResponse)
async def sync_workspace(
    request: SyncRequest, session: AsyncSession = Depends(get_db)
) -> SyncResponse:
    return await sync_service.sync_workspace(session, request)
