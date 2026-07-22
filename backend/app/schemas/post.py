from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PostCreate(BaseModel):
    title: str
    caption: Optional[str] = None
    media_url: Optional[str] = None
    platform: Optional[str] = None
    scheduled_time: Optional[datetime] = None


class PostResponse(BaseModel):
    id: int
    title: str
    caption: Optional[str]
    media_url: Optional[str]
    platform: Optional[str]
    status: str
    scheduled_time: Optional[datetime]

    model_config = {
        "from_attributes": True
    }