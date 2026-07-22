from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.content_model import Post, PostSocialAccount
from app.post_schema import PostCreate, PostResponse

router = APIRouter(prefix="/posts", tags=["Content Scheduling"])


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_or_schedule_post(post_data: PostCreate, db: Session = Depends(get_db)):
    new_post = Post(
        user_id=1,  # Hardcoded temporarily until JWT current_user dependency is attached
        title=post_data.title,
        caption=post_data.caption,
        media_file_path=post_data.media_file_path,
        content_type=post_data.content_type,
        scheduled_date=post_data.scheduled_date,
        scheduled_time=post_data.scheduled_time,
        timezone=post_data.timezone,
        is_draft=post_data.is_draft,
        publishing_status="draft" if post_data.is_draft else "scheduled"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    for acc in post_data.target_accounts:
        target = PostSocialAccount(post_id=new_post.id, account_id=acc.account_id, platform=acc.platform)
        db.add(target)

    db.commit()
    return new_post


@router.get("/dashboard", response_model=List[PostResponse])
def get_content_dashboard(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Post)
    if status:
        query = query.filter(Post.publishing_status == status)
    return query.all()


@router.get("/queue", response_model=List[PostResponse])
def get_publishing_queue(db: Session = Depends(get_db)):
    return db.query(Post).filter(Post.publishing_status == "scheduled").all()


@router.put("/{post_id}/cancel")
def cancel_scheduled_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.publishing_status = "cancelled"
    db.commit()
    return {"message": "Scheduled post cancelled successfully"}