"""Add collaboration workflow, publishing logs, analytics and reports.

Revision ID: d1f5a9b3c720
Revises: c48b4a2df619
"""
from alembic import op
import sqlalchemy as sa


revision = "d1f5a9b3c720"
down_revision = "c48b4a2df619"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "collaboration_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("business_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requested_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    for column in ("team_id", "business_user_id", "requested_by_user_id", "status"):
        op.create_index(f"ix_collaboration_requests_{column}", "collaboration_requests", [column])

    op.create_table(
        "publishing_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("external_post_id", sa.String(255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_publishing_logs_post_id", "publishing_logs", ["post_id"])
    op.create_index("ix_publishing_logs_status", "publishing_logs", ["status"])

    op.create_table(
        "analytics_metrics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(30), nullable=False),
        sa.Column("reach", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reactions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("shares", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("post_id", "platform", name="uq_post_platform_metric"),
    )
    op.create_index("ix_analytics_metrics_post_id", "analytics_metrics", ["post_id"])

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rendered_data", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    for column in ("owner_id", "client_id", "status"):
        op.create_index(f"ix_reports_{column}", "reports", [column])


def downgrade() -> None:
    for table, indexes in (
        ("reports", ("ix_reports_status", "ix_reports_client_id", "ix_reports_owner_id")),
        ("analytics_metrics", ("ix_analytics_metrics_post_id",)),
        ("publishing_logs", ("ix_publishing_logs_status", "ix_publishing_logs_post_id")),
        ("collaboration_requests", ("ix_collaboration_requests_status", "ix_collaboration_requests_requested_by_user_id", "ix_collaboration_requests_business_user_id", "ix_collaboration_requests_team_id")),
    ):
        for index in indexes:
            op.drop_index(index, table_name=table)
        op.drop_table(table)
