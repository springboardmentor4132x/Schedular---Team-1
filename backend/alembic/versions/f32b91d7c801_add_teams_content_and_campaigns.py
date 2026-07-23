"""Add teams, refresh sessions, scheduling and campaign tables.

Revision ID: f32b91d7c801
Revises: a7d4ce1f3942
"""
from alembic import op
import sqlalchemy as sa

revision = "f32b91d7c801"
down_revision = "a7d4ce1f3942"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("teams", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(150), nullable=False), sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_teams_owner_id", "teams", ["owner_id"])
    op.create_table("team_members", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("role", sa.String(50), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.UniqueConstraint("team_id", "user_id", name="uq_team_member"))
    op.create_index("ix_team_members_team_id", "team_members", ["team_id"]); op.create_index("ix_team_members_user_id", "team_members", ["user_id"])
    op.create_table("refresh_tokens", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("token_hash", sa.String(128), nullable=False, unique=True), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_table("campaigns", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("client_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("name", sa.String(150), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("objective", sa.String(100), nullable=False), sa.Column("budget", sa.Numeric(12,2)), sa.Column("category", sa.String(100)), sa.Column("priority", sa.String(20), nullable=False), sa.Column("platforms", sa.Text(), nullable=False), sa.Column("start_date", sa.DateTime(timezone=True), nullable=False), sa.Column("end_date", sa.DateTime(timezone=True), nullable=False), sa.Column("status", sa.String(20), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_campaigns_owner_id", "campaigns", ["owner_id"]); op.create_index("ix_campaigns_client_id", "campaigns", ["client_id"]); op.create_index("ix_campaigns_status", "campaigns", ["status"])
    op.create_table("posts", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("client_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("caption", sa.Text(), nullable=False), sa.Column("content_type", sa.String(20), nullable=False), sa.Column("media_urls", sa.Text(), nullable=False), sa.Column("platforms", sa.Text(), nullable=False), sa.Column("status", sa.String(20), nullable=False), sa.Column("scheduled_for", sa.DateTime(timezone=True)), sa.Column("timezone", sa.String(100), nullable=False), sa.Column("queue_position", sa.Integer()), sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    for column in ("owner_id", "client_id", "status", "scheduled_for", "campaign_id"): op.create_index(f"ix_posts_{column}", "posts", [column])
    op.create_table("campaign_posts", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False), sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.UniqueConstraint("campaign_id", "post_id", name="uq_campaign_post"))
    op.create_index("ix_campaign_posts_campaign_id", "campaign_posts", ["campaign_id"]); op.create_index("ix_campaign_posts_post_id", "campaign_posts", ["post_id"])


def downgrade() -> None:
    for table, indexes in (("campaign_posts", ("ix_campaign_posts_post_id", "ix_campaign_posts_campaign_id")), ("posts", tuple(f"ix_posts_{c}" for c in ("owner_id", "client_id", "status", "scheduled_for", "campaign_id"))), ("campaigns", ("ix_campaigns_status", "ix_campaigns_client_id", "ix_campaigns_owner_id")), ("refresh_tokens", ("ix_refresh_tokens_user_id",)), ("team_members", ("ix_team_members_user_id", "ix_team_members_team_id")), ("teams", ("ix_teams_owner_id",))):
        for index in indexes: op.drop_index(index, table_name=table)
        op.drop_table(table)
