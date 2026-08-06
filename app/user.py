from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String(50), nullable=False, default="Content Creator")

class PlatformConnection(Base):
    __tablename__ = "platform_connections"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    expiry = Column(DateTime, nullable=True)
    connected_account_name = Column(String, nullable=True)