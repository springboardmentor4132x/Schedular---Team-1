from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base
from datetime import datetime

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    caption = Column(String)
    media_url = Column(String)
    platform = Column(String)

    status = Column(String, default="draft")
    scheduled_time = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)