import asyncio
import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.content import Post, PublishingLog
import httpx

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def poll_and_publish_posts():
    """Polls the database for scheduled posts and publishes them."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # 1. Fetch posts that are scheduled and due
        due_posts = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_for <= now
        ).all()

        # 2. Fetch posts that failed previously, but have fewer than 3 attempts
        failed_posts = db.query(Post).filter(
            Post.status == "failed"
        ).all()
        
        # Filter failed posts that haven't exhausted retries (max 3)
        posts_to_process = list(due_posts)
        for post in failed_posts:
            attempts = db.query(PublishingLog).filter(PublishingLog.post_id == post.id).count()
            if attempts < 3:
                posts_to_process.append(post)
            else:
                pass # Max retries exhausted

        for post in posts_to_process:
            logger.info(f"Attempting to publish Post ID {post.id}...")
            
            # Simulate Multi-Platform Publishing
            import json
            try:
                platforms = json.loads(post.platforms) if isinstance(post.platforms, str) else post.platforms
            except Exception:
                platforms = []
                
            if not platforms:
                platforms = ["unknown"]

            for platform in platforms:
                try:
                    # SIMULATE API CALL using httpx
                    async with httpx.AsyncClient() as client:
                        # In production this points to Facebook/Twitter graph APIs
                        # response = await client.post(...)
                        pass
                    
                    # For now, we simulate a successful publish:
                    success = True 
                    error_msg = None

                    # Log the attempt
                    log_entry = PublishingLog(
                        post_id=post.id,
                        platform=platform,
                        status="success" if success else "failed",
                        error_message=error_msg
                    )
                    db.add(log_entry)

                    if success:
                        if post.recurrence_interval:
                            if post.recurrence_interval == 'daily':
                                post.scheduled_for += timedelta(days=1)
                            elif post.recurrence_interval == 'weekly':
                                post.scheduled_for += timedelta(days=7)
                            elif post.recurrence_interval == 'monthly':
                                post.scheduled_for += timedelta(days=30)
                            post.status = "scheduled"
                        else:
                            post.status = "published"
                    else:
                        post.status = "failed"
                except Exception as e:
                    logger.error(f"Error publishing post {post.id} to {platform}: {e}")
                    post.status = "failed"
                    log_entry = PublishingLog(
                        post_id=post.id,
                        platform=platform,
                        status="failed",
                        error_message=str(e)
                    )
                    db.add(log_entry)

            db.commit()

    except Exception as e:
        logger.error(f"Scheduler error: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(poll_and_publish_posts, 'interval', minutes=1, id='publish_job', replace_existing=True)
    scheduler.start()
    logger.info("Automated Publishing Engine started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Automated Publishing Engine stopped.")
