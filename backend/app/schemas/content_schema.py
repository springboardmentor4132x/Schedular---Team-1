from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator, model_validator

PLATFORMS = {"facebook", "instagram", "linkedin", "pinterest", "youtube", "x"}


class PostWrite(BaseModel):
    caption: str = Field(default="", max_length=5000)
    content_type: str = Field(
        default="text", pattern="^(text|image|video|carousel|story|reel)$"
    )
    media_urls: list[str] = Field(default_factory=list, max_length=10)
    platforms: list[str] = Field(default_factory=list, max_length=6)
    scheduled_for: datetime | None = None
    timezone: str = Field(default="UTC", max_length=100)
    client_id: int | None = None
    recurrence_interval: str | None = Field(default=None, pattern="^(daily|weekly|monthly)$")

    @model_validator(mode="after")
    def validate_content(self):
        if set(self.platforms) - PLATFORMS:
            raise ValueError("Unsupported platform selected.")
        if self.content_type != "text" and not self.media_urls:
            raise ValueError("Media is required for this content type.")
        return self


class PostUpdate(BaseModel):
    caption: str | None = Field(default=None, max_length=5000)
    content_type: str | None = Field(
        default=None, pattern="^(text|image|video|carousel|story|reel)$"
    )
    media_urls: list[str] | None = Field(default=None, max_length=10)
    platforms: list[str] | None = Field(default=None, max_length=6)
    timezone: str | None = Field(default=None, max_length=100)
    client_id: int | None = None
    recurrence_interval: str | None = Field(default=None, pattern="^(daily|weekly|monthly)$")

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, value: list[str] | None) -> list[str] | None:
        if value is not None and set(value) - PLATFORMS:
            raise ValueError("Unsupported platform selected.")
        return value


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
    status: str = Field(
        default="draft", pattern="^(draft|active|paused|completed|cancelled)$"
    )
    client_id: int | None = None

    @model_validator(mode="after")
    def validate_dates_and_platforms(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date.")
        if set(self.platforms) - PLATFORMS:
            raise ValueError("Unsupported platform selected.")
        return self


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=5000)
    objective: str | None = Field(default=None, min_length=2, max_length=100)
    budget: Decimal | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, max_length=100)
    priority: str | None = Field(default=None, pattern="^(low|medium|high)$")
    platforms: list[str] | None = Field(default=None, max_length=6)
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str | None = Field(
        default=None, pattern="^(draft|active|paused|completed|cancelled)$"
    )
    client_id: int | None = None

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, value: list[str] | None) -> list[str] | None:
        if value is not None and set(value) - PLATFORMS:
            raise ValueError("Unsupported platform selected.")
        return value


class AssignPosts(BaseModel):
    post_ids: list[int] = Field(min_length=1)


class CampaignAssignment(BaseModel):
    campaign_id: int | None = None
