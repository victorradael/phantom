import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Migrations are written by hand — no ORM metadata needed for autogenerate.
target_metadata = None

# Accept both postgresql:// (asyncpg direct) and postgresql+asyncpg:// (SQLAlchemy).
_raw_url = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/phantom",
)
DATABASE_URL = (
    _raw_url
    if _raw_url.startswith("postgresql+asyncpg://")
    else _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
)


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _do_run_migrations(connection):  # type: ignore[no-untyped-def]
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as connection:
        await connection.run_sync(_do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
