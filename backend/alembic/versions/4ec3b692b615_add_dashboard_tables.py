"""Add dashboard user data tables.

Revision ID: 4ec3b692b615
Revises: eb58776892d9
"""
from alembic import op
import sqlalchemy as sa

revision = "4ec3b692b615"
down_revision = "eb58776892d9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("user_profiles",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("first_name", sa.String(100), nullable=False), sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("timezone", sa.String(100), nullable=False), sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("language", sa.String(10), nullable=False), sa.Column("avatar_data", sa.LargeBinary(), nullable=True),
        sa.Column("avatar_content_type", sa.String(100), nullable=True), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True))
    op.create_table("user_settings",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("language", sa.String(10), nullable=False), sa.Column("timezone", sa.String(100), nullable=False), sa.Column("theme", sa.String(20), nullable=False),
        sa.Column("email_notifications", sa.Boolean(), nullable=False), sa.Column("push_notifications", sa.Boolean(), nullable=False),
        sa.Column("publishing_alerts", sa.Boolean(), nullable=False), sa.Column("campaign_alerts", sa.Boolean(), nullable=False), sa.Column("security_alerts", sa.Boolean(), nullable=False))
    for name, columns in (("notifications", [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("type", sa.String(20), nullable=False), sa.Column("is_read", sa.Boolean(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False)]),
                          ("social_accounts", [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("platform", sa.String(30), nullable=False), sa.Column("status", sa.String(20), nullable=False), sa.Column("account_name", sa.String(150)), sa.Column("account_email", sa.String(150)), sa.Column("permissions", sa.Text(), nullable=False), sa.Column("last_sync", sa.DateTime(timezone=True))]),
                          ("activity_logs", [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("activity", sa.String(255), nullable=False), sa.Column("platform", sa.String(30)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False)])):
        op.create_table(name, *columns)
        op.create_index(f"ix_{name}_user_id", name, ["user_id"])


def downgrade() -> None:
    for name in ("activity_logs", "social_accounts", "notifications"):
        op.drop_index(f"ix_{name}_user_id", table_name=name)
        op.drop_table(name)
    op.drop_table("user_settings")
    op.drop_table("user_profiles")
