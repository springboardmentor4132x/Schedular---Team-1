from pydantic import BaseModel, EmailStr
from typing import Optional


class UserProfileUpdate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    language: Optional[str] = None


class UserProfileResponse(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    country: str
    timezone: str
    organization: str
    role: str
    bio: str
    language: str
    avatarUrl: Optional[str] = None

    class Config:
        from_attributes = True
