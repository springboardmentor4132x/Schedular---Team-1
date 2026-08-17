"""Celery tasks for real provider publication.

Unit tests may replace provider classes or enable Celery eager mode, but this
task never inserts a synthetic provider ID or declares a post published without
an actual adapter result.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from datetime import datetime, timedelta, timezone

import httpx
from celery import shared_task
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.integrations.social.facebook import FacebookProvider
from app.integrations.social.instagram import InstagramProvider
from app.integrations.social.linkedin import LinkedInProvider
from app.integrations.social.pinterest import PinterestProvider
from app.integrations.social.x import XProvider
from app.integrations.social.youtube import YouTubeProvider
from app.models.content import Post, PublishingLog
from app.models.user import SocialAccount
from app.services.publishing_service import finalize_post_publication, process_pending_publications

logger = logging.getLogger(__name__)
UPLOAD_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads"


@shared_task(name="app.tasks.publishing_tasks.poll_scheduled_posts")
def poll_scheduled_posts():
    """Poll for due posts; Celery Beat invokes this task once per minute."""
    db: Session = SessionLocal()
    try:
        return process_pending_publications(db)
    except Exception:
        logger.exception("Scheduled publication poll failed")
        raise
    finally:
        db.close()


def get_provider(platform: str):
    providers = {
        "linkedin": LinkedInProvider,
        "facebook": FacebookProvider,
        "instagram": InstagramProvider,
        "x": XProvider,
        "youtube": YouTubeProvider,
        "pinterest": PinterestProvider,
    }
    provider = providers.get(platform)
    if provider is None:
        raise ValueError(f"Unsupported publishing platform: {platform}")
    return provider()


def _media_payload(post: Post) -> tuple[list[str], list[str]]:
    """Return public URLs plus safe local upload paths for provider adapters."""
    media_urls = json.loads(post.media_urls or "[]")
    public_urls: list[str] = []
    local_paths: list[str] = []
    base_url = (settings.MEDIA_PUBLIC_BASE_URL or settings.APP_BASE_URL).rstrip("/")
    for url in media_urls:
        if url.startswith("/uploads/"):
            storage_key = url.removeprefix("/uploads/")
            path = (UPLOAD_DIRECTORY / storage_key).resolve()
            if path.parent != UPLOAD_DIRECTORY.resolve() or not path.exists():
                raise ValueError("A selected media file is no longer available.")
            local_paths.append(str(path))
            public_urls.append(f"{base_url}{url}")
        else:
            public_urls.append(url)
    return public_urls, local_paths


def _content_payload(post: Post) -> dict:
    public_urls, local_paths = _media_payload(post)
    try:
        options = json.loads(post.platform_options or "{}")
    except (TypeError, ValueError):
        options = {}
    return {
        "text": post.caption,
        "title": post.caption.strip().split("\n", 1)[0][:100] or "SocialPilot video",
        "content_type": post.content_type,
        "mediaUrls": public_urls,
        "media_paths": local_paths,
        "platform_options": options,
    }


def _set_failure(log: PublishingLog, message: str, duration_ms: int) -> None:
    log.status = "failed"
    log.error_message = message[:2000]
    log.duration_ms = duration_ms


@shared_task(
    name="app.tasks.publishing_tasks.publish_post_task",
    bind=True,
    max_retries=3,
)
def publish_post_task(self, post_id: int, platform: str, attempt_id: int):
    """Publish exactly one post-platform attempt and persist its provider result."""
    started = time.monotonic()
    db: Session = SessionLocal()
    try:
        post = db.get(Post, post_id)
        attempt = db.get(PublishingLog, attempt_id)
        if post is None or attempt is None or attempt.post_id != post_id or attempt.platform != platform:
            return {"status": "ignored"}
        if attempt.status == "published":
            return {"status": "already_published", "externalPostId": attempt.external_post_id}
        if post.status not in {"publishing", "failed"}:
            return {"status": "ignored"}

        account = None
        if attempt.social_account_id:
            account = db.get(SocialAccount, attempt.social_account_id)
        if account is None:
            account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.user_id == post.owner_id,
                    SocialAccount.platform == platform,
                    SocialAccount.status == "connected",
                )
                .order_by(SocialAccount.id.asc())
                .first()
            )
        if account is None or not account.access_token_encrypted:
            _set_failure(
                attempt,
                "No connected account or usable access token is available for this platform.",
                int((time.monotonic() - started) * 1000),
            )
            db.commit()
            finalize_post_publication(db, post_id)
            return {"status": "failed"}

        attempt.status = "publishing"
        attempt.social_account_id = account.id
        db.commit()
        
        provider = get_provider(platform)
        if account.token_expires_at and account.token_expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
            if account.refresh_token_encrypted and hasattr(provider, "refresh_token"):
                try:
                    new_access, new_refresh, exp_in = provider.refresh_token(account.refresh_token_encrypted)
                    if new_access:
                        account.access_token_encrypted = new_access
                        if new_refresh:
                            account.refresh_token_encrypted = new_refresh
                        if exp_in:
                            account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(exp_in))
                        db.commit()
                except Exception as e:
                    logger.error(f"Failed to auto-refresh token for {platform}: {e}")

        try:
            content = _content_payload(post)
            if platform == "linkedin" and account.external_account_id:
                account_id = account.external_account_id
                content["author_urn"] = (
                    account_id
                    if account_id.startswith("urn:li:")
                    else f"urn:li:person:{account_id}"
                )
            external_id = get_provider(platform).publish_post(
                account.access_token_encrypted, content
            )
            if not external_id or external_id == "unknown-id":
                raise ValueError("The provider did not return a published object ID.")
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            duration = int((time.monotonic() - started) * 1000)
            if self.request.retries < settings.PUBLISH_MAX_RETRIES:
                attempt.status = "retrying"
                attempt.error_message = f"Temporary provider error: {str(exc)[:1000]}"
                attempt.duration_ms = duration
                db.commit()
                raise self.retry(exc=exc, countdown=settings.PUBLISH_RETRY_SECONDS * (2 ** self.request.retries))
            _set_failure(attempt, f"Provider connection failed: {exc}", duration)
            account.last_error = attempt.error_message
            db.commit()
            finalize_post_publication(db, post_id)
            return {"status": "failed"}
        except Exception as exc:
            _set_failure(
                attempt,
                str(exc),
                int((time.monotonic() - started) * 1000),
            )
            account.last_error = attempt.error_message
            db.commit()
            finalize_post_publication(db, post_id)
            return {"status": "failed"}

        attempt.status = "published"
        attempt.external_post_id = str(external_id)
        attempt.provider_response = json.dumps({"provider_object_id": str(external_id)})
        attempt.error_message = None
        attempt.duration_ms = int((time.monotonic() - started) * 1000)
        account.last_error = None
        db.commit()
        final_status = finalize_post_publication(db, post_id)
        return {"status": "published", "externalPostId": str(external_id), "postStatus": final_status}
    finally:
        db.close()
