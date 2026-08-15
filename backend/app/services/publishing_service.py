"""Durable scheduling and publication orchestration.

This module never manufactures a provider result.  It records a queued attempt
before dispatching a Celery task, and the worker changes that attempt to
``published`` only after a provider returns a real external object ID.
"""

from __future__ import annotations

import json
import logging
from calendar import monthrange
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.content import Post, PublishingLog
from app.models.user import ActivityLog, Notification, SocialAccount

logger = logging.getLogger(__name__)

FINAL_ATTEMPT_STATUSES = {"published", "failed", "cancelled"}
ACTIVE_ATTEMPT_STATUSES = {"queued", "publishing", "retrying"}


def _platforms(post: Post) -> list[str]:
    try:
        return list(dict.fromkeys(json.loads(post.platforms or "[]")))
    except (TypeError, ValueError):
        return []


def _account_ids(post: Post) -> dict[str, int]:
    try:
        data = json.loads(post.platform_account_ids or "{}")
        if isinstance(data, list):
            return {}
        return {key: int(value) for key, value in data.items()}
    except (TypeError, ValueError, AttributeError):
        return {}


def _latest_attempts(db: Session, post_id: int) -> dict[str, PublishingLog]:
    """Return the latest persisted attempt for each platform."""
    rows = (
        db.query(PublishingLog)
        .filter(PublishingLog.post_id == post_id)
        .order_by(PublishingLog.platform.asc(), PublishingLog.attempt_number.desc(), PublishingLog.id.desc())
        .all()
    )
    latest: dict[str, PublishingLog] = {}
    for row in rows:
        latest.setdefault(row.platform, row)
    return latest


def _next_attempt_number(db: Session, post_id: int, platform: str) -> int:
    previous = (
        db.query(PublishingLog.attempt_number)
        .filter(PublishingLog.post_id == post_id, PublishingLog.platform == platform)
        .order_by(PublishingLog.attempt_number.desc())
        .first()
    )
    return (previous[0] if previous else 0) + 1


def claim_due_post(db: Session, post_id: int) -> Post | None:
    """Claim a due post with a compare-and-swap update.

    The commit happens before any task is dispatched, so a second scheduler or
    HTTP request cannot queue the same scheduled post concurrently.
    """
    now = datetime.now(timezone.utc)
    claimed = (
        db.query(Post)
        .filter(
            Post.id == post_id,
            Post.status == "scheduled",
            Post.scheduled_for.is_not(None),
            Post.scheduled_for <= now,
        )
        .update({"status": "publishing"}, synchronize_session=False)
    )
    if not claimed:
        return None
    db.commit()
    return db.get(Post, post_id)


def _enqueue_platform_attempt(
    db: Session, post: Post, platform: str, social_account_id: int | None
) -> PublishingLog | None:
    """Persist a queued attempt unless one is already active for the platform."""
    latest = _latest_attempts(db, post.id).get(platform)
    if latest and latest.status in ACTIVE_ATTEMPT_STATUSES:
        return None
    attempt = PublishingLog(
        post_id=post.id,
        platform=platform,
        social_account_id=social_account_id,
        status="queued",
        attempt_number=_next_attempt_number(db, post.id, platform),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def _dispatch_attempt(post_id: int, platform: str, attempt_id: int) -> None:
    # Imported locally to avoid the service/task circular dependency at app load.
    from app.tasks.publishing_tasks import publish_post_task

    publish_post_task.delay(post_id, platform, attempt_id)


def _mark_dispatch_failure(db: Session, attempt: PublishingLog, reason: str) -> None:
    attempt.status = "failed"
    attempt.error_message = reason[:2000]
    db.add(attempt)
    db.commit()


def process_pending_publications(db: Session) -> list[dict]:
    """Queue due or explicitly-requested posts for durable worker processing."""
    now = datetime.now(timezone.utc)
    due_ids = [
        row[0]
        for row in db.query(Post.id)
        .filter(Post.status == "scheduled", Post.scheduled_for.is_not(None), Post.scheduled_for <= now)
        .all()
    ]
    claimed_ids = [post.id for post_id in due_ids if (post := claim_due_post(db, post_id))]
    requested_ids = [
        row[0]
        for row in db.query(Post.id)
        .filter(Post.status == "publishing")
        .all()
    ]

    processed: list[dict] = []
    for post_id in dict.fromkeys([*claimed_ids, *requested_ids]):
        post = db.get(Post, post_id)
        if post is None or post.status != "publishing":
            continue
        platforms = _platforms(post)
        account_ids = _account_ids(post)
        if not platforms:
            post.status = "failed"
            db.add(
                PublishingLog(
                    post_id=post.id,
                    platform="system",
                    status="failed",
                    error_message="No publishing platforms were selected.",
                    attempt_number=1,
                )
            )
            db.commit()
            processed.append({"postId": post.id, "status": "failed"})
            continue

        queued_platforms: list[str] = []
        for platform in platforms:
            latest = _latest_attempts(db, post.id).get(platform)
            # A retry should only send platforms that did not already publish.
            # Published cross-platform targets remain immutable and visible in
            # their log history.
            if latest and latest.status == "published":
                continue
            attempt = _enqueue_platform_attempt(db, post, platform, account_ids.get(platform))
            if attempt is None:
                continue
            try:
                _dispatch_attempt(post.id, platform, attempt.id)
                queued_platforms.append(platform)
            except Exception as exc:  # broker/configuration failure, never fake completion
                logger.exception("Unable to enqueue publishing task", extra={"post_id": post.id, "platform": platform})
                _mark_dispatch_failure(db, attempt, f"Unable to queue background job: {exc}")

        finalize_post_publication(db, post.id)
        processed.append(
            {
                "postId": post.id,
                "status": "queued_for_publishing" if queued_platforms else post.status,
                "platforms": queued_platforms,
            }
        )
    return processed


def _recurrence_time(value: datetime, interval: str) -> datetime:
    if interval == "daily":
        return value + timedelta(days=1)
    if interval == "weekly":
        return value + timedelta(days=7)
    # Monthly recurrence preserves the day where possible and clamps correctly
    # for e.g. January 31 -> February 28/29.
    month = value.month + 1
    year = value.year + (1 if month == 13 else 0)
    month = 1 if month == 13 else month
    return value.replace(year=year, month=month, day=min(value.day, monthrange(year, month)[1]))


def _create_next_recurrence(db: Session, post: Post, scheduled_for: datetime | None) -> None:
    if not post.recurrence_interval or scheduled_for is None:
        return
    next_time = _recurrence_time(scheduled_for, post.recurrence_interval)
    exists = (
        db.query(Post.id)
        .filter(
            Post.owner_id == post.owner_id,
            Post.caption == post.caption,
            Post.scheduled_for == next_time,
            Post.recurrence_interval == post.recurrence_interval,
        )
        .first()
    )
    if exists:
        return
    db.add(
        Post(
            owner_id=post.owner_id,
            client_id=post.client_id,
            caption=post.caption,
            content_type=post.content_type,
            media_urls=post.media_urls,
            platforms=post.platforms,
            platform_account_ids=post.platform_account_ids,
            platform_options=post.platform_options,
            status="scheduled",
            scheduled_for=next_time,
            timezone=post.timezone,
            queue_position=post.queue_position,
            campaign_id=post.campaign_id,
            recurrence_interval=post.recurrence_interval,
        )
    )


def finalize_post_publication(db: Session, post_id: int) -> str | None:
    """Update the parent post after every platform has a final latest attempt."""
    post = db.get(Post, post_id)
    if post is None:
        return None
    platforms = _platforms(post)
    latest = _latest_attempts(db, post_id)
    if not platforms or not all(platform in latest for platform in platforms):
        return None
    platform_statuses = [latest[platform].status for platform in platforms]
    if any(status in ACTIVE_ATTEMPT_STATUSES for status in platform_statuses):
        return None

    prior_status = post.status
    scheduled_for = post.scheduled_for
    if all(status == "published" for status in platform_statuses):
        post.status = "published"
        post.scheduled_for = None
        post.queue_position = None
        _create_next_recurrence(db, post, scheduled_for)
        if prior_status != "published":
            db.add(
                Notification(
                    user_id=post.owner_id,
                    title="Publishing completed",
                    description=f"Your post was published to {', '.join(platforms)}.",
                    category="Publishing",
                    type="published",
                )
            )
            db.add(ActivityLog(user_id=post.owner_id, activity="Published post"))
    else:
        post.status = "failed"
        if prior_status != "failed":
            failed_platforms = [platform for platform in platforms if latest[platform].status != "published"]
            db.add(
                Notification(
                    user_id=post.owner_id,
                    title="Publishing needs attention",
                    description=f"Publication failed for {', '.join(failed_platforms)}. You can retry it from the queue.",
                    category="Publishing",
                    type="failed",
                )
            )
            db.add(ActivityLog(user_id=post.owner_id, activity="Post publishing failed"))
    db.commit()
    return post.status
