"""Replaceable publishing adapter boundary.

The development adapter records a clearly-labelled mock publication. Real platform
adapters belong here once OAuth publishing credentials and platform review are ready.
"""

import json
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models.content import Post, PublishingLog
from app.models.user import ActivityLog, Notification


def publish_with_mock_adapter(db: Session, post: Post) -> list[PublishingLog]:
    platforms = json.loads(post.platforms)
    logs: list[PublishingLog] = []
    for platform in platforms:
        log = PublishingLog(
            post_id=post.id,
            platform=platform,
            status="published",
            external_post_id=f"mock-{platform}-{uuid4().hex}",
        )
        db.add(log)
        logs.append(log)
    post.status = "published"
    post.scheduled_for = None
    post.queue_position = None
    db.add(
        ActivityLog(user_id=post.owner_id, activity="Published post (development mock)")
    )
    db.add(
        Notification(
            user_id=post.owner_id,
            title="Post published",
            message="Your post was published using the development mock adapter.",
            type="publish",
        )
    )
    if post.client_id and post.client_id != post.owner_id:
        db.add(
            Notification(
                user_id=post.client_id,
                title="Post published",
                message="A post for your workspace was published using the development mock adapter.",
                type="publish",
            )
        )
    return logs


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

    This function has no HTTP dependencies and is the entry point for a worker
    process. The current adapter is deliberately a development mock.
    """
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
            logs = publish_with_mock_adapter(db, post)
            processed.append(
                {
                    "postId": post.id,
                    "status": "published",
                    "logs": len(logs),
                    "mode": "mock",
                }
            )
        except Exception as exc:  # adapter failures must leave an auditable state
            post.status = "failed"
            db.add(
                PublishingLog(
                    post_id=post.id,
                    platform="system",
                    status="failed",
                    error_message=str(exc)[:2000],
                )
            )
            db.add(
                Notification(
                    user_id=post.owner_id,
                    title="Post publishing failed",
                    message="The publishing worker could not publish your post.",
                    type="publish",
                )
            )
            processed.append(
                {"postId": post.id, "status": "failed", "logs": 1, "mode": "mock"}
            )
    db.commit()
    return processed
