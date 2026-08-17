import time
from app.database import SessionLocal
from app.models.content import Post
from app.services.publishing_service import claim_due_post, _platforms, _account_ids, _enqueue_platform_attempt, _latest_attempts
from app.tasks.publishing_tasks import publish_post_task
import logging
import concurrent.futures
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)

def process_sync():
    db = SessionLocal()
    try:
        now_time = datetime.now(timezone.utc)
        posts = db.query(Post).filter(
            (Post.status == "publishing") | 
            ((Post.status == "scheduled") & (Post.scheduled_for <= now_time))
        ).all()
        for post in posts:
            if post.status == "scheduled":
                # claim
                post.status = "publishing"
                db.commit()
            
            platforms = _platforms(post)
            account_ids = _account_ids(post)
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=len(platforms) if platforms else 1) as executor:
                futures = []
                for platform in platforms:
                    latest = _latest_attempts(db, post.id).get(platform)
                    if latest and latest.status == "published":
                        continue
                        
                    attempt = latest if latest and latest.status in {"queued", "publishing"} else None
                    if not attempt:
                        attempt = _enqueue_platform_attempt(db, post, platform, account_ids.get(platform))
                        
                    if attempt:
                        print(f"Publishing post {post.id} to {platform} synchronously...")
                        futures.append(executor.submit(publish_post_task, post.id, platform, attempt.id))
                
                # Wait for all platforms to finish publishing for this post
                for future in concurrent.futures.as_completed(futures):
                    try:
                        future.result()
                    except Exception as exc:
                        print(f"Error publishing: {exc}")
                print(f"Done publishing post {post.id}.")
    finally:
        db.close()

if __name__ == "__main__":
    process_sync()
