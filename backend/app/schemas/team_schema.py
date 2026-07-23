from pydantic import BaseModel, Field, field_validator


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)


class TeamInvite(BaseModel):
    email: str = Field(min_length=3, max_length=150)
    role: str = "Content Creator"

    @field_validator("role")
    @classmethod
    def valid_member_role(cls, value: str) -> str:
        if value not in {"Marketing Team", "Content Creator", "Business User"}:
            raise ValueError("Unsupported team role")
        return value
