import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float
from app.database import Base

class PublishingStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    PUBLISHED = "Published"
    FAILED = "Failed"
    CANCELLED = "Cancelled"
    PENDING_APPROVAL = "Pending Approval"

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)

class PostMedia(Base):
    __tablename__ = "post_media"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    media_url = Column(String, nullable=False)
    media_type = Column(String, nullable=False)

class PostTarget(Base):
    __tablename__ = "post_targets"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform_connection_id = Column(Integer, ForeignKey("platform_connections.id", ondelete="CASCADE"), nullable=True)

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)

class PublishingQueue(Base):
    __tablename__ = "publishing_queue"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform_connection_id = Column(Integer, ForeignKey("platform_connections.id", ondelete="CASCADE"), nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(String, default=PublishingStatus.PENDING_APPROVAL.value)

class PublishingLog(Base):
    __tablename__ = "publishing_logs"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    attempt_time = Column(DateTime, nullable=False)
    status = Column(String, nullable=False)
    api_response = Column(JSON, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)

class PostAnalytics(Base):
    __tablename__ = "post_analytics"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    last_synced = Column(DateTime, nullable=True)

class AudienceAnalytics(Base):
    __tablename__ = "audience_analytics"
    id = Column(Integer, primary_key=True, index=True)
    platform_connection_id = Column(Integer, ForeignKey("platform_connections.id", ondelete="CASCADE"), nullable=True)
    followers = Column(Integer, default=0)
    new_followers = Column(Integer, default=0)
    lost_followers = Column(Integer, default=0)
    gender_distribution = Column(JSON, nullable=True)
    age_distribution = Column(JSON, nullable=True)
    location_data = Column(JSON, nullable=True)

class CampaignAnalytics(Base):
    __tablename__ = "campaign_analytics"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=True)
    total_posts = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    engagement = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    roi = Column(Float, nullable=True)
    completion_percentage = Column(Float, default=0.0)

class PlatformAnalytics(Base):
    __tablename__ = "platform_analytics"
    id = Column(Integer, primary_key=True, index=True)
    platform_name = Column(String, nullable=False)
    followers = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    engagement = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)