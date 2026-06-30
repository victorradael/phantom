"""Add tenant_id to workspaces and links

Revision ID: 003
Revises: 002
Create Date: 2026-06-30
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- workspaces ---
    op.execute("ALTER TABLE workspaces ADD COLUMN tenant_id INTEGER DEFAULT 0")
    op.execute("UPDATE workspaces SET tenant_id = 0 WHERE tenant_id IS NULL")
    op.execute("ALTER TABLE workspaces ALTER COLUMN tenant_id SET NOT NULL")
    op.execute("ALTER TABLE workspaces ALTER COLUMN tenant_id DROP DEFAULT")

    # Replace global uuid uniqueness with per-tenant composite uniqueness
    op.execute("DROP INDEX IF EXISTS ix_workspaces_uuid")
    op.execute("ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_uuid_key")
    op.execute(
        "CREATE UNIQUE INDEX ix_workspaces_uuid_tenant ON workspaces (uuid, tenant_id)"
    )
    op.execute("CREATE INDEX ix_workspaces_tenant_id ON workspaces (tenant_id)")

    # --- links ---
    op.execute("ALTER TABLE links ADD COLUMN tenant_id INTEGER DEFAULT 0")
    op.execute("UPDATE links SET tenant_id = 0 WHERE tenant_id IS NULL")
    op.execute("ALTER TABLE links ALTER COLUMN tenant_id SET NOT NULL")
    op.execute("ALTER TABLE links ALTER COLUMN tenant_id DROP DEFAULT")

    op.execute("DROP INDEX IF EXISTS ix_links_uuid")
    op.execute("ALTER TABLE links DROP CONSTRAINT IF EXISTS links_uuid_key")
    op.execute(
        "CREATE UNIQUE INDEX ix_links_uuid_tenant ON links (uuid, tenant_id)"
    )
    op.execute("CREATE INDEX ix_links_tenant_id ON links (tenant_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_links_tenant_id")
    op.execute("DROP INDEX IF EXISTS ix_links_uuid_tenant")
    op.execute("ALTER TABLE links DROP COLUMN IF EXISTS tenant_id")
    op.execute("CREATE UNIQUE INDEX ix_links_uuid ON links (uuid)")

    op.execute("DROP INDEX IF EXISTS ix_workspaces_tenant_id")
    op.execute("DROP INDEX IF EXISTS ix_workspaces_uuid_tenant")
    op.execute("ALTER TABLE workspaces DROP COLUMN IF EXISTS tenant_id")
    op.execute("CREATE UNIQUE INDEX ix_workspaces_uuid ON workspaces (uuid)")
