from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class PostSocialAccount(Base):
    __tablename__ = "post_social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(String, nullable=False)
    platform = Column(String, nullable=False)

class CampaignPost(Base):
    __tablename__ = "campaign_posts"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    caption = Column(Text, nullable=True)
    media_file_path = Column(String, nullable=True)
    content_type = Column(String, default="text")
    scheduled_date = Column(String, nullable=True)
    scheduled_time = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    publishing_status = Column(String, default="scheduled")
    is_draft = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    social_accounts = relationship("PostSocialAccount", cascade="all, delete-orphan")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(String, nullable=True)
    budget = Column(Float, default=0.0)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)