import time
import logging
from app.database import SessionLocal
from app.models.content import Post
from app.services.publishing_service import claim_due_post, _platforms, _account_ids, _enqueue_platform_attempt, _latest_attempts
from app.tasks.publishing_tasks import publish_post_task

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def process_sync():
    db = SessionLocal()
    try:
        now = time.time()
        # Fetch posts that need to be published
        posts = db.query(Post).filter(Post.status.in_(["scheduled", "publishing"])).all()
        for post in posts:
            # We only process scheduled posts that are due
            if post.status == "scheduled":
                if post.scheduled_for and post.scheduled_for.timestamp() <= now:
                    post.status = "publishing"
                    db.commit()
                else:
                    continue # Not due yet

            platforms = _platforms(post)
            account_ids = _account_ids(post)
            
            for platform in platforms:
                latest = _latest_attempts(db, post.id).get(platform)
                if latest and latest.status == "published":
                    continue
                    
                attempt = _enqueue_platform_attempt(db, post, platform, account_ids.get(platform))
                if attempt:
                    logging.info(f"Publishing post {post.id} to {platform} synchronously...")
                    publish_post_task(post.id, platform, attempt.id)
                    logging.info(f"Done publishing post {post.id} to {platform}.")
    finally:
        db.close()

if __name__ == "__main__":
    logging.info("Starting local background worker (No Redis required)...")
    logging.info("Press CTRL+C to stop.")
    try:
        while True:
            process_sync()
            # Wait for 60 seconds before checking again
            time.sleep(60)
    except KeyboardInterrupt:
        logging.info("Local background worker stopped.")
