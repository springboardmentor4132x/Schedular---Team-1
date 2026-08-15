import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    name="app.tasks.notification_tasks.send_email_notification",
    bind=True,
    max_retries=3,
)
def send_email_notification(self, user_email: str, subject: str, message: str):
    """Celery task to send an email asynchronously.

    Uses exponential backoff for retries if the email server is temporarily unavailable.
    """
    try:
        # In a real production environment, integrate with SendGrid, SES, or SMTP here
        logger.info(
            f"Simulating sending email to {user_email} with subject '{subject}'"
        )

        # simulated logic
        # raise Exception("Simulated email failure")

        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {user_email}: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2**self.request.retries)


@shared_task(
    name="app.tasks.notification_tasks.send_push_notification", bind=True, max_retries=3
)
def send_push_notification(self, device_token: str, title: str, message: str):
    """Celery task to send a push notification (e.g. via FCM or APNS)."""
    try:
        logger.info(f"Simulating push notification to token {device_token} - '{title}'")
        return True
    except Exception as exc:
        logger.error(f"Failed to send push notification to {device_token}: {exc}")
        raise self.retry(exc=exc, countdown=2**self.request.retries)

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.content import Post
from app.models.user import User

@shared_task(name="app.tasks.notification_tasks.check_upcoming_posts")
def check_upcoming_posts():
    """Scan for posts scheduled in the next 24 hours that haven't triggered a reminder."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        target_time = now + timedelta(hours=24)
        
        # We need to find posts scheduled in the next 24h.
        upcoming_posts = (
            db.query(Post)
            .filter(
                Post.status == "scheduled",
                Post.scheduled_for > now,
                Post.scheduled_for <= target_time
            )
            .all()
        )

        for post in upcoming_posts:
            # We can use the platform_options json to store a flag if reminder was sent.
            import json
            try:
                options = json.loads(post.platform_options or "{}")
            except Exception:
                options = {}
            
            if not options.get("reminder_sent"):
                user = db.get(User, post.owner_id)
                if user and user.email:
                    logger.info(f"Sending reminder for post {post.id} to {user.email}")
                    send_email_notification.delay(
                        user.email,
                        "Upcoming Post Reminder",
                        f"Your post is scheduled to be published at {post.scheduled_for}."
                    )
                options["reminder_sent"] = True
                post.platform_options = json.dumps(options)
        
        db.commit()
    except Exception as exc:
        logger.exception("Failed to check upcoming posts")
        db.rollback()
    finally:
        db.close()
