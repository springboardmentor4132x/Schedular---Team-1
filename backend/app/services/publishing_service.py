"""Publishing service with real platform provider integration."""

import json
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.content import Post, PublishingLog
from app.models.user import ActivityLog, Notification, SocialAccount
from app.services.token_service import ensure_valid_token
from app.publishing import get_provider

logger = logging.getLogger(__name__)


async def publish_with_provider(db: Session, post: Post) -> list[PublishingLog]:
    """Publish a post to real social media platforms using OAuth tokens.

    Args:
        db: Database session
        post: Post object with platforms, caption, media_urls

    Returns:
        List of PublishingLog entries (one per platform)
    """
    platforms = json.loads(post.platforms) if isinstance(post.platforms, str) else post.platforms
    logs: list[PublishingLog] = []

    for platform in platforms:
        # Get connected account for this platform
        account = db.query(SocialAccount).filter(
            SocialAccount.user_id == post.owner_id,
            SocialAccount.platform == platform,
            SocialAccount.status == "connected"
        ).first()

        if not account:
            # Account not connected - log error
            logger.warning(
                "No connected %s account for post id=%s (owner_id=%s)",
                platform,
                post.id,
                post.owner_id,
            )
            log = PublishingLog(
                post_id=post.id,
                platform=platform,
                status="failed",
                error_message=f"{platform} account not connected"
            )
            db.add(log)
            logs.append(log)
            continue

        logger.info(
            "Publishing post id=%s to %s using SocialAccount id=%s; access_token_present=%s",
            post.id,
            platform,
            account.id,
            bool(account.access_token_encrypted),
        )

        try:
            # Ensure token is valid (refresh if needed)
            valid_token = await ensure_valid_token(db, account)

            # Get provider for this platform
            provider = get_provider(platform, valid_token)

            if not provider:
                # Platform not yet implemented
                log = PublishingLog(
                    post_id=post.id,
                    platform=platform,
                    status="failed",
                    error_message=f"{platform} publishing not yet implemented"
                )
                db.add(log)
                logs.append(log)
                continue

            # Publish to platform
            result = await provider.publish(post)

            # Create log entry
            log = PublishingLog(
                post_id=post.id,
                platform=platform,
                status="published" if result.success else "failed",
                external_post_id=result.external_post_id,
                error_message=result.error_message
            )
            db.add(log)
            logs.append(log)

        except Exception as exc:
            # Preserve the real error (e.g. HTTPException.detail from the token
            # service) instead of collapsing it to an empty or generic string.
            detail = getattr(exc, "detail", None) or str(exc) or repr(exc)
            logger.error(
                "Publishing post id=%s to %s failed: %s",
                post.id,
                platform,
                detail,
                exc_info=True,
            )
            log = PublishingLog(
                post_id=post.id,
                platform=platform,
                status="failed",
                error_message=str(detail)[:2000]
            )
            db.add(log)
            logs.append(log)

    # Update post status based on results
    all_success = all(log.status == "published" for log in logs)
    any_success = any(log.status == "published" for log in logs)

    if all_success:
        post.status = "published"
        activity_msg = "Published post to all platforms"
        notif_msg = "Your post was successfully published to all platforms."
    elif any_success:
        post.status = "partial"
        activity_msg = "Published post to some platforms"
        notif_msg = "Your post was published to some platforms. Check logs for details."
    else:
        post.status = "failed"
        activity_msg = "Failed to publish post"
        notif_msg = "Your post could not be published. Check logs for details."

    post.scheduled_for = None
    post.queue_position = None

    # Add activity log
    db.add(ActivityLog(user_id=post.owner_id, activity=activity_msg))

    # Add notification
    db.add(
        Notification(
            user_id=post.owner_id,
            title="Post published" if any_success else "Post publishing failed",
            message=notif_msg,
            type="publish",
        )
    )

    if post.client_id and post.client_id != post.owner_id:
        db.add(
            Notification(
                user_id=post.client_id,
                title="Post published" if any_success else "Post publishing failed",
                message=f"A post for your workspace was {'published' if any_success else 'not published'}.",
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


async def process_pending_publications(db: Session) -> list[dict]:
    """Process work claimed by a scheduler or requested through Publish Now.

    This function has no HTTP dependencies and is the entry point for a worker
    process. Now uses real platform providers with OAuth tokens.
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
            logs = await publish_with_provider(db, post)

            # Determine overall status
            all_success = all(log.status == "published" for log in logs)
            any_success = any(log.status == "published" for log in logs)

            if all_success:
                status = "published"
            elif any_success:
                status = "partial"
            else:
                status = "failed"

            processed.append(
                {
                    "postId": post.id,
                    "status": status,
                    "logs": len(logs),
                    "mode": "provider",
                }
            )
        except Exception as exc:  # adapter failures must leave an auditable state
            post.status = "failed"
            detail = getattr(exc, "detail", None) or str(exc) or repr(exc)
            logger.error(
                "Publishing worker error for post id=%s: %s",
                post.id,
                detail,
                exc_info=True,
            )
            db.add(
                PublishingLog(
                    post_id=post.id,
                    platform="system",
                    status="failed",
                    error_message=str(detail)[:2000],
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
                {"postId": post.id, "status": "failed", "logs": 1, "mode": "provider"}
            )
    db.commit()
    return processed
