from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SocialAccountTarget(BaseModel):
    account_id: str
    platform: str

class PostCreate(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    media_file_path: Optional[str] = None
    content_type: str = "text"
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    timezone: str = "UTC"
    is_draft: bool = False
    target_accounts: List[SocialAccountTarget] = []

class PostResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str]
    caption: Optional[str]
    media_file_path: Optional[str]
    content_type: str
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    timezone: str
    publishing_status: str
    is_draft: bool
    created_at: datetime

    class Config:
        from_attributes = True