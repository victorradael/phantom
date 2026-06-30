"""Add tenant_id to tags table

Revision ID: 004
Revises: 003
Create Date: 2026-06-30
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE tags ADD COLUMN tenant_id INTEGER DEFAULT 0")
    op.execute("UPDATE tags SET tenant_id = 0 WHERE tenant_id IS NULL")
    op.execute("ALTER TABLE tags ALTER COLUMN tenant_id SET NOT NULL")
    op.execute("ALTER TABLE tags ALTER COLUMN tenant_id DROP DEFAULT")

    op.execute("DROP INDEX IF EXISTS ix_tags_uuid")
    op.execute("ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_uuid_key")
    op.execute("CREATE UNIQUE INDEX ix_tags_uuid_tenant ON tags (uuid, tenant_id)")
    op.execute("CREATE INDEX ix_tags_tenant_id ON tags (tenant_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_tags_tenant_id")
    op.execute("DROP INDEX IF EXISTS ix_tags_uuid_tenant")
    op.execute("ALTER TABLE tags DROP COLUMN IF EXISTS tenant_id")
    op.execute("CREATE UNIQUE INDEX ix_tags_uuid ON tags (uuid)")
