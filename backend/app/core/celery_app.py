from celery import Celery
from app.config import settings

celery_app = Celery(
    "socialpilot",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Production work is asynchronous.  Tests can opt into eager execution via
    # CELERY_TASK_ALWAYS_EAGER=true without changing source code.
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    task_routes={
        "app.tasks.publishing_tasks.*": {"queue": "publishing"},
        "app.tasks.analytics_tasks.*": {"queue": "analytics"},
        "app.tasks.notification_tasks.*": {"queue": "notifications"},
    },
    beat_schedule={
        "poll-scheduled-posts": {
            "task": "app.tasks.publishing_tasks.poll_scheduled_posts",
            "schedule": 60.0,  # every 60 seconds
        },
        "check-upcoming-posts": {
            "task": "app.tasks.notification_tasks.check_upcoming_posts",
            "schedule": 3600.0,  # every hour
        },
    },
)

# Autodiscover tasks if they are in specific modules
celery_app.autodiscover_tasks(["app.tasks"])
