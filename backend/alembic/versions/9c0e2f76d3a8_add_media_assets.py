"""Add media asset metadata for uploaded scheduling media.

Revision ID: 9c0e2f76d3a8
Revises: f32b91d7c801
"""
from alembic import op
import sqlalchemy as sa

revision = "9c0e2f76d3a8"
down_revision = "f32b91d7c801"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("media_assets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("storage_key", sa.String(255), nullable=False, unique=True),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_media_assets_owner_id", "media_assets", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_media_assets_owner_id", table_name="media_assets")
    op.drop_table("media_assets")
