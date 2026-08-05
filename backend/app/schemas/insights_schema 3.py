from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class ReportCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    client_id: int | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None

    @model_validator(mode="after")
    def valid_range(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self
