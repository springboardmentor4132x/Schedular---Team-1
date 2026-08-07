from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
import logging
import json

from app.database import get_db
from app.models.user import User, SocialAccount
from app.models.content import Post
from app.services.auth_service import get_current_user
from app.services.publishing_service import process_pending_publications

router = APIRouter(prefix="/publishing", tags=["Publishing"])
logger = logging.getLogger(__name__)


@router.get("/queue")
def get_publishing_queue(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all posts currently in the publishing queue (scheduled or queued)."""
    posts = (
        db.query(Post)
        .filter(Post.owner_id == user.id)
        .filter(Post.status.in_(["scheduled", "queued"]))
        .order_by(Post.scheduled_for.asc())
        .all()
    )

    return {
        "success": True,
        "message": "Queue retrieved successfully",
        "data": [
            {
                "id": p.id,
                "caption": p.caption,
                "status": p.status,
                "scheduled_for": p.scheduled_for,
                "platforms": (
                    json.loads(p.platforms)
                    if isinstance(p.platforms, str)
                    else p.platforms
                ),
                "content_type": p.content_type,
            }
            for p in posts
        ],
    }


@router.get("/logs")
def get_publishing_logs(
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get publishing history and logs."""
    from app.models.content import PublishingLog
    from sqlalchemy import desc as _desc

    posts = (
        db.query(Post)
        .filter(Post.owner_id == user.id)
        .order_by(desc(Post.updated_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Build a map of post_id → latest PublishingLog so we can surface the real
    # error_message without an expensive per-row query.
    post_ids = [p.id for p in posts]
    if post_ids:
        latest_logs = (
            db.query(PublishingLog)
            .filter(PublishingLog.post_id.in_(post_ids))
            .order_by(PublishingLog.post_id, _desc(PublishingLog.attempted_at))
            .all()
        )
        # Keep only the most recent log per post
        log_by_post: dict[int, PublishingLog] = {}
        for log in latest_logs:
            if log.post_id not in log_by_post:
                log_by_post[log.post_id] = log
    else:
        log_by_post = {}

    return {
        "success": True,
        "message": "Logs retrieved successfully",
        "data": {
            "items": [
                {
                    "id": p.id,
                    "caption": p.caption,
                    "status": p.status,
                    "published_at": p.updated_at if p.status == "published" else None,
                    "platforms": (
                        json.loads(p.platforms)
                        if isinstance(p.platforms, str)
                        else p.platforms
                    ),
                    # Surface the real error stored in publishing_logs — never None
                    # for failed posts that actually went through the provider.
                    "error_message": (
                        log_by_post[p.id].error_message
                        if p.id in log_by_post
                        else None
                    ),
                }
                for p in posts
            ]
        },
    }


@router.get("/accounts")
def get_social_accounts(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get social accounts connected to the current user."""
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == user.id).all()

    return {
        "success": True,
        "message": "Accounts retrieved successfully",
        "data": [
            {
                "id": acc.id,
                "platform": acc.platform,
                "status": acc.status,
                "account_name": acc.account_name,
            }
            for acc in accounts
        ],
    }


@router.post("/run-due")
async def trigger_run_due(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Trigger the worker to process due posts."""
    try:
        processed = await process_pending_publications(db)
        return {
            "success": True,
            "message": f"Publishing worker triggered successfully. Processed {len(processed)} posts.",
            "data": {"processed": processed},
        }
    except Exception as e:
        logger.error(f"Error running due posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retry/{post_id}")
def retry_failed_post(
    post_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retry a failed post by setting it back to scheduled."""
    post = db.query(Post).filter(Post.id == post_id, Post.owner_id == user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed posts can be retried")

    post.status = "scheduled"
    post.scheduled_for = datetime.now(timezone.utc)
    db.commit()

    return {
        "success": True,
        "message": "Post rescheduled for publishing",
        "data": {"id": post.id, "status": post.status},
    }


@router.delete("/{post_id}")
def delete_post(
    post_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete a post from the queue/history."""
    post = db.query(Post).filter(Post.id == post_id, Post.owner_id == user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.delete(post)
    db.commit()

    return {
        "success": True,
        "message": "Post deleted successfully",
        "data": {"id": post_id},
    }
