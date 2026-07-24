
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.post import Post
from app.schemas.post import PostCreate, PostResponse

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/", response_model=PostResponse)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    new_post = Post(
        title=post.title,
        caption=post.caption,
        media_url=post.media_url,
        platform=post.platform,
        scheduled_time=post.scheduled_time,
        status="scheduled" if post.scheduled_time else "draft"
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post


@router.get("/", response_model=list[PostResponse])
def get_posts(status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if status:
        return db.query(Post).filter(Post.status == status).all()

    return db.query(Post).all()
@router.get("/stats")
def get_post_stats(db: Session = Depends(get_db)):
    total = db.query(Post).count()
    drafts = db.query(Post).filter(Post.status == "draft").count()
    scheduled = db.query(Post).filter(Post.status == "scheduled").count()
    published = db.query(Post).filter(Post.status == "published").count()

    return {
        "total": total,
        "drafts": drafts,
        "scheduled": scheduled,
        "published": published
    }
@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        return {"message": "Post not found"}

    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}
@router.put("/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post: PostCreate, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()

    if not db_post:
        return {"message": "Post not found"}

    db_post.title = post.title
    db_post.caption = post.caption
    db_post.media_url = post.media_url
    db_post.platform = post.platform
    db_post.scheduled_time = post.scheduled_time
    db_post.status = "scheduled" if post.scheduled_time else "draft"

    db.commit()
    db.refresh(db_post)

    return db_post
@router.put("/{post_id}/publish")
def publish_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        return {"message": "Post not found"}

    post.status = "published"

    db.commit()
    db.refresh(post)

    return {
        "message": "Post published successfully",
        "post": post
    }