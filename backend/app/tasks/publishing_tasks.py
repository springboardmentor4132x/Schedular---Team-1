import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from celery import shared_task

from app.database import SessionLocal
from app.models.content import Post, PublishingLog
from app.services.publishing_service import process_pending_publications

logger = logging.getLogger(__name__)

@shared_task(name="app.tasks.publishing_tasks.poll_scheduled_posts")
def poll_scheduled_posts():
    """Polls the database for scheduled posts and enqueues them for publishing."""
    db: Session = SessionLocal()
    try:
        # We delegate to the publishing service which handles claiming and processing
        processed = process_pending_publications(db)
        if processed:
            logger.info(f"Polled and processed {len(processed)} posts.")
    except Exception as e:
        logger.error(f"Error in poll_scheduled_posts: {e}")
    finally:
        db.close()

import json
from app.models.user import SocialAccount
from app.integrations.social.linkedin import LinkedInProvider

@shared_task(name="app.tasks.publishing_tasks.publish_post_task", bind=True, max_retries=3)
def publish_post_task(self, post_id: int):
    """Specific task for publishing a single post to allow fine-grained retries."""
    db: Session = SessionLocal()
    try:
        post = db.get(Post, post_id)
        if not post:
            return
            
        platforms = json.loads(post.platforms)
        logs = []
        success = True
        
        for platform in platforms:
            account = db.query(SocialAccount).filter(
                SocialAccount.user_id == post.owner_id, 
                SocialAccount.platform == platform,
                SocialAccount.status == "connected"
            ).first()
            
            if not account or not account.access_token_encrypted:
                log = PublishingLog(post_id=post.id, platform=platform, status="failed", error_message="No connected account or missing token.")
                db.add(log)
                success = False
                continue
                
            try:
                external_id = None
                if platform == "linkedin":
                    provider = LinkedInProvider()
                    content = {"text": post.caption}
                    # We would also attach media here based on post.media_urls if supported
                    external_id = provider.publish_post(account.access_token_encrypted, content)
                else:
                    # Explicit failure for unimplemented production platforms
                    raise NotImplementedError(f"Publishing to {platform} is not currently implemented in production.")
                    
                log = PublishingLog(post_id=post.id, platform=platform, status="published", external_post_id=external_id)
                db.add(log)
            except Exception as e:
                logger.error(f"Failed to publish to {platform}: {e}")
                log = PublishingLog(post_id=post.id, platform=platform, status="failed", error_message=str(e)[:2000])
                db.add(log)
                success = False
        
        if success:
            post.status = "published"
            post.scheduled_for = None
            post.queue_position = None
        else:
            # Note: if partial success occurs, we leave it as failed so it can be reviewed or retried
            post.status = "failed"
            
        db.commit()
    except Exception as exc:
        logger.error(f"Publishing task failed: {exc}")
        db.rollback()
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()
