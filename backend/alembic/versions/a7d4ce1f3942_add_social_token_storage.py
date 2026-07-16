"""Add encrypted OAuth token storage for connected social accounts.

Revision ID: a7d4ce1f3942
Revises: 4ec3b692b615
"""
from alembic import op
import sqlalchemy as sa

revision = "a7d4ce1f3942"
down_revision = "4ec3b692b615"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("social_accounts", sa.Column("access_token_encrypted", sa.Text(), nullable=True))
    op.add_column("social_accounts", sa.Column("refresh_token_encrypted", sa.Text(), nullable=True))
    op.add_column("social_accounts", sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("social_accounts", "token_expires_at")
    op.drop_column("social_accounts", "refresh_token_encrypted")
    op.drop_column("social_accounts", "access_token_encrypted")
