"""Run scheduled publishing work and background tasks via Celery.

Usage: celery -A app.core.celery_app worker --loglevel=info
"""

import sys
from app.core.celery_app import celery_app

def main() -> None:
    # Run the Celery worker programmatically if executed directly
    argv = ["worker", "--loglevel=info"]
    celery_app.worker_main(argv)

if __name__ == "__main__":
    main()

