import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.publishing_service import process_pending_publications

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def poll_and_publish_posts():
    """Polls the database for scheduled posts and publishes them using real platform providers."""
    db: Session = SessionLocal()
    try:
        logger.info("Scheduler polling for due posts...")
        processed = await process_pending_publications(db)
        if processed:
            logger.info(f"Processed {len(processed)} posts: {processed}")
    except Exception as e:
        logger.error(f"Scheduler error: {e}", exc_info=True)
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(poll_and_publish_posts, 'interval', minutes=1, id='publish_job', replace_existing=True)
    scheduler.start()
    logger.info("Automated Publishing Engine started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Automated Publishing Engine stopped.")
