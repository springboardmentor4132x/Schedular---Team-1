from pydantic import BaseModel, EmailStr, Field


class ProfileUpdate(BaseModel):
    firstName: str = Field(min_length=1, max_length=100)
    lastName: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    country: str | None = None
    timezone: str | None = None
    organization: str | None = None
    role: str | None = None
    bio: str | None = Field(default=None, max_length=300)
    language: str | None = None


class SettingsUpdate(BaseModel):
    section: str
    language: str | None = None
    timezone: str | None = None
    country: str | None = None
    theme: str | None = None
    emailNotifications: bool | None = None
    pushNotifications: bool | None = None
    publishingAlerts: bool | None = None
    campaignAlerts: bool | None = None
    securityAlerts: bool | None = None


class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=8, max_length=72)
