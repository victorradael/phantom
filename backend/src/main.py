from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import workspaces, links, sync
from src.db.database import init_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_pool()
    yield
    await close_pool()


app = FastAPI(
    title="Phantom Sync API",
    version="1.0.0",
    description="Workspace synchronization backend for Phantom",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
app.include_router(links.router, prefix="/links", tags=["links"])
app.include_router(sync.router, prefix="/sync", tags=["sync"])


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "phantom-sync"}
