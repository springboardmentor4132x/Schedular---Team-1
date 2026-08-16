from pydantic import BaseModel
from typing import Optional, Dict, Any


class SettingsUpdateRequest(BaseModel):
    section: str
    language: Optional[str] = None
    timezone: Optional[str] = None
    country: Optional[str] = None
    emailNotifications: Optional[bool] = None
    pushNotifications: Optional[bool] = None
    publishingAlerts: Optional[bool] = None
    campaignAlerts: Optional[bool] = None
    securityAlerts: Optional[bool] = None
    theme: Optional[str] = None
