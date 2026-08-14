import logging
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task(name="app.tasks.notification_tasks.send_email_notification", bind=True, max_retries=3)
def send_email_notification(self, user_email: str, subject: str, message: str):
    """Celery task to send an email asynchronously.
    
    Uses exponential backoff for retries if the email server is temporarily unavailable.
    """
    try:
        # In a real production environment, integrate with SendGrid, SES, or SMTP here
        logger.info(f"Simulating sending email to {user_email} with subject '{subject}'")
        
        # simulated logic
        # raise Exception("Simulated email failure") 
        
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {user_email}: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@shared_task(name="app.tasks.notification_tasks.send_push_notification", bind=True, max_retries=3)
def send_push_notification(self, device_token: str, title: str, message: str):
    """Celery task to send a push notification (e.g. via FCM or APNS)."""
    try:
        logger.info(f"Simulating push notification to token {device_token} - '{title}'")
        return True
    except Exception as exc:
        logger.error(f"Failed to send push notification to {device_token}: {exc}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
