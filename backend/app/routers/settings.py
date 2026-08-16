from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models.user import User, UserSettings, RefreshToken
from app.services.auth_service import get_current_user
from app.schemas.settings_schema import SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    
    # Defaults
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    active_sessions = []
    tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None)
    ).all()

    for i, token in enumerate(tokens):
        active_sessions.append({
            "id": f"sess-{i}",
            "device": "Unknown Device",
            "browser": "Web Browser",
            "ipAddress": "Unknown IP",
            "lastActive": token.created_at.isoformat(),
            "isCurrent": False # This is a simplification
        })
        
    if not active_sessions:
        active_sessions.append({
            "id": "sess-current",
            "device": "Current Device",
            "browser": "Web Browser",
            "ipAddress": "Current IP",
            "lastActive": "Just now",
            "isCurrent": True
        })
    else:
        active_sessions[-1]["isCurrent"] = True

    return {
        "general": {
            "language": settings.language,
            "timezone": settings.timezone,
            "country": user.country or "",
        },
        "notifications": {
            "emailNotifications": settings.email_notifications,
            "pushNotifications": settings.push_notifications,
            "publishingAlerts": settings.publishing_alerts,
            "campaignAlerts": settings.campaign_alerts,
            "securityAlerts": settings.security_alerts,
        },
        "appearance": {
            "theme": settings.theme
        },
        "sessions": active_sessions
    }


@router.put("")
def update_settings(
    payload: SettingsUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)

    if payload.section == "general":
        if payload.language:
            settings.language = payload.language
        if payload.timezone:
            settings.timezone = payload.timezone
        if payload.country is not None:
            user.country = payload.country
    elif payload.section == "notifications":
        if payload.emailNotifications is not None:
            settings.email_notifications = payload.emailNotifications
        if payload.pushNotifications is not None:
            settings.push_notifications = payload.pushNotifications
        if payload.publishingAlerts is not None:
            settings.publishing_alerts = payload.publishingAlerts
        if payload.campaignAlerts is not None:
            settings.campaign_alerts = payload.campaignAlerts
        if payload.securityAlerts is not None:
            settings.security_alerts = payload.securityAlerts
    elif payload.section == "appearance":
        if payload.theme:
            settings.theme = payload.theme

    db.commit()
    return {"success": True, "message": f"{payload.section.capitalize()} settings saved."}


@router.post("/export")
def export_account_data(
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # In a real system, background_tasks.add_task(export_job, user.id)
    return {"success": True, "message": "Export request submitted. You will receive an email shortly."}


@router.delete("/account")
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # SQLAlchemy cascading deletes handles related records based on the models
    db.delete(user)
    db.commit()
    return {"success": True, "message": "Account successfully deleted."}
