from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    objective: Optional[str] = None
    budget: float = 0.0
    start_date: str
    end_date: str

class CampaignResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    objective: Optional[str]
    budget: float
    start_date: str
    end_date: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AssignPostsRequest(BaseModel):
    post_ids: List[int]