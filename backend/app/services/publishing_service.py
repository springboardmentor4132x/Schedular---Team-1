"""Replaceable publishing adapter boundary.

The development adapter records a clearly-labelled mock publication. Real platform
adapters belong here once OAuth publishing credentials and platform review are ready.
"""

import json
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.orm import Session
import logging

from app.models.content import Post, PublishingLog
from app.models.user import ActivityLog, Notification

logger = logging.getLogger(__name__)

def claim_due_post(db: Session, post_id: int) -> Post | None:
    """Atomically claim a due post so concurrent workers cannot publish it twice."""
    now = datetime.now(timezone.utc)
    claimed = (
        db.query(Post)
        .filter(
            Post.id == post_id, Post.status == "scheduled", Post.scheduled_for <= now
        )
        .update({"status": "publishing"}, synchronize_session=False)
    )
    if not claimed:
        return None
    db.flush()
    return db.get(Post, post_id)


def process_pending_publications(db: Session) -> list[dict]:
    """Process work claimed by a scheduler or requested through Publish Now.
    Enqueues Celery tasks for durable, retriable execution.
    """
    # Import locally to avoid circular dependency
    from app.tasks.publishing_tasks import publish_post_task
    
    now = datetime.now(timezone.utc)
    due_ids = [
        row[0]
        for row in db.query(Post.id)
        .filter(Post.status == "scheduled", Post.scheduled_for <= now)
        .all()
    ]
    requested_ids = [
        row[0] for row in db.query(Post.id).filter(Post.status == "publishing").all()
    ]
    processed: list[dict] = []
    
    for post_id in due_ids:
        if claim_due_post(db, post_id) is not None:
            requested_ids.append(post_id)
            
    for post_id in set(requested_ids):
        post = db.get(Post, post_id)
        if post is None or post.status != "publishing":
            continue
        
        try:
            # Enqueue the actual publishing task via Celery
            publish_post_task.delay(post.id)
            processed.append({"postId": post.id, "status": "queued_for_publishing", "mode": "production"})
        except Exception as exc:
            logger.error(f"Failed to enqueue publishing task for post {post.id}: {exc}")
            post.status = "failed"
            db.add(
                PublishingLog(
                    post_id=post.id,
                    platform="system",
                    status="failed",
                    error_message=f"Failed to enqueue background job: {str(exc)[:1000]}",
                )
            )
            processed.append({"postId": post.id, "status": "failed_to_queue", "mode": "production"})
    db.commit()
    return processed
