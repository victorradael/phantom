"""
Migration runner — executa arquivos .sql em ordem usando asyncpg.
Mantém controle de versão na tabela `schema_migrations`.

Uso:
    DATABASE_URL=postgresql://... python migrations/runner.py
"""

import asyncio
import os
import sys
from pathlib import Path

import asyncpg

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/phantom"
)
MIGRATIONS_DIR = Path(__file__).parent


async def run() -> None:
    print(f"Connecting to {DATABASE_URL.split('@')[-1]}...")
    conn = await asyncpg.connect(dsn=DATABASE_URL)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id          SERIAL PRIMARY KEY,
            filename    TEXT UNIQUE NOT NULL,
            applied_at  TIMESTAMP DEFAULT now()
        )
    """)

    applied: set[str] = {
        row["filename"]
        for row in await conn.fetch("SELECT filename FROM schema_migrations")
    }

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print("No migration files found.")
        await conn.close()
        return

    pending = [f for f in sql_files if f.name not in applied]
    if not pending:
        print("All migrations already applied.")
        await conn.close()
        return

    for sql_file in pending:
        print(f"  Applying {sql_file.name}...")
        sql = sql_file.read_text(encoding="utf-8")
        async with conn.transaction():
            await conn.execute(sql)
            await conn.execute(
                "INSERT INTO schema_migrations (filename) VALUES ($1)", sql_file.name
            )
        print(f"  OK: {sql_file.name}")

    print(f"\nDone — {len(pending)} migration(s) applied.")
    await conn.close()


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        sys.exit(1)
