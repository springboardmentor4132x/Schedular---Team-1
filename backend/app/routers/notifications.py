from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models.user import User, Notification
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user notifications."""
    query = db.query(Notification).filter(Notification.user_id == user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    notifications = (
        query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    )

    return {
        "success": True,
        "total": total,
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "description": n.description,
                "category": n.category,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "read_timestamp": (
                    n.read_timestamp.isoformat() if n.read_timestamp else None
                ),
            }
            for n in notifications
        ],
    }


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    n.is_read = True
    n.read_timestamp = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}


@router.post("/read-all")
def mark_all_as_read(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Mark all unread notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).update(
        {"is_read": True, "read_timestamp": datetime.now(timezone.utc)},
        synchronize_session=False,
    )

    db.commit()
    return {"success": True}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific notification."""
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(n)
    db.commit()
    return {"success": True}
