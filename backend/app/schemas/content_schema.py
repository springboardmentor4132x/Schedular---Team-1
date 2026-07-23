from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator

PLATFORMS = {"facebook", "instagram", "linkedin", "pinterest", "youtube", "x"}


class PostWrite(BaseModel):
    caption: str = Field(default="", max_length=5000)
    content_type: str = Field(default="text", pattern="^(text|image|video|carousel|story|reel)$")
    media_urls: list[str] = Field(default_factory=list, max_length=10)
    platforms: list[str] = Field(default_factory=list, max_length=6)
    scheduled_for: datetime | None = None
    timezone: str = Field(default="UTC", max_length=100)
    client_id: int | None = None

    @model_validator(mode="after")
    def validate_content(self):
        if set(self.platforms) - PLATFORMS:
            raise ValueError("Unsupported platform selected.")
        if self.content_type != "text" and not self.media_urls:
            raise ValueError("Media is required for this content type.")
        return self


class ScheduleWrite(BaseModel):
    scheduled_for: datetime
    timezone: str = Field(default="UTC", max_length=100)


class QueueReorder(BaseModel):
    post_ids: list[int] = Field(min_length=1)


class CampaignWrite(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str = Field(default="", max_length=5000)
    objective: str = Field(min_length=2, max_length=100)
    budget: Decimal | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, max_length=100)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    platforms: list[str] = Field(default_factory=list, max_length=6)
    start_date: datetime
    end_date: datetime
    status: str = Field(default="draft", pattern="^(draft|active|paused|completed|cancelled)$")
    client_id: int | None = None

    @model_validator(mode="after")
    def validate_dates_and_platforms(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date.")
        if set(self.platforms) - PLATFORMS:
            raise ValueError("Unsupported platform selected.")
        return self


class AssignPosts(BaseModel):
    post_ids: list[int] = Field(min_length=1)
