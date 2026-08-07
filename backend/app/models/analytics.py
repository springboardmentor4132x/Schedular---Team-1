from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    JSON,
    Float,
    Boolean,
    Text,
)
from sqlalchemy.sql import func
from app.database import Base


class PostAnalytics(Base):
    __tablename__ = "post_analytics"
    __table_args__ = (
        UniqueConstraint("post_id", "platform", name="uq_post_platform_analytics"),
    )
    id = Column(Integer, primary_key=True)
    post_id = Column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform = Column(String(30), nullable=False)
    likes = Column(Integer, nullable=True, default=0)
    comments = Column(Integer, nullable=True, default=0)
    shares = Column(Integer, nullable=True, default=0)
    saves = Column(Integer, nullable=True, default=0)
    reach = Column(Integer, nullable=True, default=0)
    impressions = Column(Integer, nullable=True, default=0)
    clicks = Column(Integer, nullable=True, default=0)
    engagement_rate = Column(Float, nullable=True, default=0.0)
    analytics_available = Column(Boolean, nullable=False, default=True)
    error_reason = Column(Text, nullable=True)
    last_synced = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AudienceAnalytics(Base):
    __tablename__ = "audience_analytics"
    id = Column(Integer, primary_key=True)
    platform = Column(String(30), nullable=False, index=True)
    followers = Column(Integer, nullable=False, default=0)
    new_followers = Column(Integer, nullable=False, default=0)
    lost_followers = Column(Integer, nullable=False, default=0)
    gender_distribution = Column(JSON, nullable=True)
    age_distribution = Column(JSON, nullable=True)
    country_distribution = Column(JSON, nullable=True)
    city_distribution = Column(JSON, nullable=True)
    most_active_hours = Column(JSON, nullable=True)
    most_active_days = Column(JSON, nullable=True)
    recorded_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CampaignAnalytics(Base):
    __tablename__ = "campaign_analytics"
    id = Column(Integer, primary_key=True)
    campaign_id = Column(
        Integer,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    total_posts = Column(Integer, nullable=False, default=0)
    reach = Column(Integer, nullable=False, default=0)
    impressions = Column(Integer, nullable=False, default=0)
    engagement = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    roi = Column(Float, nullable=True)
    completion_percentage = Column(Float, nullable=False, default=0.0)
    last_synced = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PlatformAnalytics(Base):
    __tablename__ = "platform_analytics"
    id = Column(Integer, primary_key=True)
    platform = Column(String(30), nullable=False, index=True, unique=True)
    followers = Column(Integer, nullable=False, default=0)
    reach = Column(Integer, nullable=False, default=0)
    engagement = Column(Integer, nullable=False, default=0)
    impressions = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    last_synced = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
