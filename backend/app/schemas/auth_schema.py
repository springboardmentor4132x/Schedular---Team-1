from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    country: Optional[str] = None
    role: str
    organization: Optional[str] = None

    @field_validator("role")
    @classmethod
    def normalize_role(cls, value: str) -> str:
        roles = {
            "administrator": "Administrator",
            "marketing_team": "Marketing Team",
            "business_user": "Business User",
            "content_creator": "Content Creator",
            "Administrator": "Administrator",
            "Marketing Team": "Marketing Team",
            "Business User": "Business User",
            "Content Creator": "Content Creator",
        }
        if value not in roles:
            raise ValueError("Unsupported role")
        return roles[value]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    role: str
    country: Optional[str] = None
    organization: Optional[str] = None
    avatarUrl: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str
