"""Add marketing-team client workspace assignments.

Revision ID: c48b4a2df619
Revises: 9c0e2f76d3a8
"""
from alembic import op
import sqlalchemy as sa

revision = "c48b4a2df619"
down_revision = "9c0e2f76d3a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("client_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("business_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("team_id", "business_user_id", name="uq_team_client"),
    )
    op.create_index("ix_client_assignments_team_id", "client_assignments", ["team_id"])
    op.create_index("ix_client_assignments_business_user_id", "client_assignments", ["business_user_id"])


def downgrade() -> None:
    op.drop_index("ix_client_assignments_business_user_id", table_name="client_assignments")
    op.drop_index("ix_client_assignments_team_id", table_name="client_assignments")
    op.drop_table("client_assignments")
