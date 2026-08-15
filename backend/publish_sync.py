import time
from app.database import SessionLocal
from app.models.content import Post
from app.services.publishing_service import claim_due_post, _platforms, _account_ids, _enqueue_platform_attempt, _latest_attempts
from app.tasks.publishing_tasks import publish_post_task
import logging

logging.basicConfig(level=logging.INFO)

def process_sync():
    db = SessionLocal()
    try:
        now = time.time()
        posts = db.query(Post).filter(Post.status.in_(["scheduled", "publishing"])).all()
        for post in posts:
            if post.status == "scheduled":
                # claim
                post.status = "publishing"
                db.commit()
            
            platforms = _platforms(post)
            account_ids = _account_ids(post)
            for platform in platforms:
                latest = _latest_attempts(db, post.id).get(platform)
                if latest and latest.status == "published":
                    continue
                attempt = _enqueue_platform_attempt(db, post, platform, account_ids.get(platform))
                if attempt:
                    print(f"Publishing post {post.id} to {platform} synchronously...")
                    publish_post_task(post.id, platform, attempt.id)
                    print("Done publishing.")
    finally:
        db.close()

if __name__ == "__main__":
    process_sync()
