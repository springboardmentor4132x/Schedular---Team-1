"""Scheduling and campaign APIs. Publishing is intentionally not implemented."""
import json
import shutil
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Campaign, CampaignPost, MediaAsset, Post
from app.models.user import ActivityLog, ClientAssignment, SocialAccount, Team, User
from app.schemas.content_schema import AssignPosts, CampaignWrite, PostWrite, QueueReorder, ScheduleWrite
from app.services.auth_service import get_current_user

router = APIRouter(tags=["Content & Campaigns"])
MANAGERS = {"Administrator", "Marketing Team", "Content Creator"}
UPLOAD_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads"
SUPPORTED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"}


def _require_content_access(user: User):
    if user.role not in MANAGERS:
        raise HTTPException(status_code=403, detail="Business Users can view scheduling information but cannot manage content.")


def _post_payload(post: Post):
    return {"id": post.id, "ownerId": post.owner_id, "clientId": post.client_id, "caption": post.caption,
            "contentType": post.content_type, "mediaUrls": json.loads(post.media_urls), "platforms": json.loads(post.platforms),
            "status": post.status, "scheduledFor": post.scheduled_for, "timezone": post.timezone,
            "queuePosition": post.queue_position, "campaignId": post.campaign_id, "createdAt": post.created_at, "updatedAt": post.updated_at}


def _client_is_available(client_id: int | None, user: User, db: Session) -> bool:
    if client_id is None:
        return True
    if user.role == "Administrator":
        return db.query(User).filter(User.id == client_id, User.role == "Business User").first() is not None
    return db.query(ClientAssignment).join(Team, Team.id == ClientAssignment.team_id).filter(
        Team.owner_id == user.id, ClientAssignment.business_user_id == client_id).first() is not None


def _post_scope(user: User, db: Session):
    if user.role == "Business User":
        return Post.client_id == user.id
    return Post.owner_id == user.id


def _campaign_scope(user: User):
    return Campaign.client_id == user.id if user.role == "Business User" else Campaign.owner_id == user.id


def _campaign_payload(campaign: Campaign, db: Session):
    posts = db.query(Post).filter(Post.campaign_id == campaign.id).all()
    total = len(posts); scheduled = sum(p.status == "scheduled" for p in posts); published = sum(p.status == "published" for p in posts)
    return {"id": campaign.id, "ownerId": campaign.owner_id, "clientId": campaign.client_id, "name": campaign.name,
            "description": campaign.description, "objective": campaign.objective, "budget": float(campaign.budget) if campaign.budget is not None else None,
            "category": campaign.category, "priority": campaign.priority, "platforms": json.loads(campaign.platforms),
            "startDate": campaign.start_date, "endDate": campaign.end_date, "status": campaign.status,
            "totalPosts": total, "scheduledPosts": scheduled, "completedPosts": published, "pendingPosts": total - published,
            "completionPercentage": round((published / total) * 100) if total else 0, "createdAt": campaign.created_at}


def _owned_post(post_id: int, user: User, db: Session) -> Post:
    post = db.get(Post, post_id)
    if not post or (post.owner_id != user.id and user.role != "Administrator"):
        raise HTTPException(status_code=404, detail="Post not found.")
    return post


@router.post("/media", status_code=status.HTTP_201_CREATED)
async def upload_media(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user)
    if file.content_type not in SUPPORTED_MEDIA_TYPES:
        raise HTTPException(status_code=422, detail="Upload a JPG, PNG, WebP, MP4, or WebM file.")
    suffix = Path(file.filename or "upload").suffix.lower()
    storage_key = f"{uuid4().hex}{suffix}"
    target = UPLOAD_DIRECTORY / storage_key
    UPLOAD_DIRECTORY.mkdir(exist_ok=True)
    with target.open("wb") as stream:
        shutil.copyfileobj(file.file, stream)
    size = target.stat().st_size
    if size > 25 * 1024 * 1024:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="Media files must be 25 MB or smaller.")
    asset = MediaAsset(owner_id=user.id, original_name=file.filename or storage_key, storage_key=storage_key, content_type=file.content_type, size_bytes=size)
    db.add(asset); db.commit(); db.refresh(asset)
    return {"id": asset.id, "url": f"/uploads/{asset.storage_key}", "name": asset.original_name, "contentType": asset.content_type, "sizeBytes": asset.size_bytes}


@router.get("/posts")
def list_posts(status_filter: str | None = Query(None, alias="status"), search: str | None = None, start: datetime | None = None, end: datetime | None = None, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Post).filter(_post_scope(user, db))
    if status_filter: query = query.filter(Post.status == status_filter)
    if search: query = query.filter(Post.caption.ilike(f"%{search}%"))
    if start: query = query.filter(Post.scheduled_for >= start)
    if end: query = query.filter(Post.scheduled_for <= end)
    total = query.count(); posts = query.order_by(Post.scheduled_for.asc().nulls_last(), Post.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": [_post_payload(p) for p in posts], "total": total, "skip": skip, "limit": limit}


@router.post("/posts", status_code=status.HTTP_201_CREATED)
def create_post(payload: PostWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user)
    if not _client_is_available(payload.client_id, user, db):
        raise HTTPException(status_code=403, detail="Choose a client assigned to your marketing team.")
    post = Post(owner_id=user.id, client_id=payload.client_id, caption=payload.caption, content_type=payload.content_type, media_urls=json.dumps(payload.media_urls), platforms=json.dumps(payload.platforms), timezone=payload.timezone)
    db.add(post); db.add(ActivityLog(user_id=user.id, activity="Created draft")); db.commit(); db.refresh(post)
    return _post_payload(post)


@router.put("/posts/{post_id}")
def update_post(post_id: int, payload: PostWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); post = _owned_post(post_id, user, db)
    if post.status == "published": raise HTTPException(status_code=409, detail="Published posts cannot be edited.")
    for name, value in {"caption": payload.caption, "content_type": payload.content_type, "media_urls": json.dumps(payload.media_urls), "platforms": json.dumps(payload.platforms), "timezone": payload.timezone, "client_id": payload.client_id}.items(): setattr(post, name, value)
    db.commit(); db.refresh(post); return _post_payload(post)


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); post = _owned_post(post_id, user, db); db.delete(post); db.commit()


@router.post("/posts/{post_id}/schedule")
def schedule_post(post_id: int, payload: ScheduleWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); post = _owned_post(post_id, user, db)
    platforms = json.loads(post.platforms)
    if not platforms: raise HTTPException(status_code=422, detail="Select at least one platform before scheduling.")
    connected = {row.platform for row in db.query(SocialAccount).filter(SocialAccount.user_id == user.id, SocialAccount.status == "connected").all()}
    unavailable = set(platforms) - connected
    if unavailable:
        raise HTTPException(status_code=422, detail=f"Connect the selected account(s) before scheduling: {', '.join(sorted(unavailable))}.")
    if payload.scheduled_for <= datetime.now(timezone.utc): raise HTTPException(status_code=422, detail="Schedule time must be in the future.")
    post.status, post.scheduled_for, post.timezone = "scheduled", payload.scheduled_for, payload.timezone
    post.queue_position = (db.query(Post).filter(Post.owner_id == user.id, Post.status == "scheduled").count() + 1)
    db.add(ActivityLog(user_id=user.id, activity="Scheduled post")); db.commit(); db.refresh(post); return _post_payload(post)


@router.post("/posts/{post_id}/cancel")
def cancel_schedule(post_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); post = _owned_post(post_id, user, db)
    post.status, post.scheduled_for, post.queue_position = "cancelled", None, None; db.commit(); return _post_payload(post)


@router.get("/queue")
def get_queue(search: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Post).filter(_post_scope(user, db), Post.status == "scheduled")
    if search: query = query.filter(Post.caption.ilike(f"%{search}%"))
    return [_post_payload(p) for p in query.order_by(Post.queue_position, Post.scheduled_for).all()]


@router.put("/queue/reorder")
def reorder_queue(payload: QueueReorder, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user)
    posts = db.query(Post).filter(Post.owner_id == user.id, Post.id.in_(payload.post_ids), Post.status == "scheduled").all()
    if len(posts) != len(set(payload.post_ids)): raise HTTPException(status_code=422, detail="Queue contains posts you cannot reorder.")
    by_id = {p.id: p for p in posts}
    for index, post_id in enumerate(payload.post_ids, 1): by_id[post_id].queue_position = index
    db.commit(); return {"success": True}


@router.get("/campaigns")
def list_campaigns(search: str | None = None, status_filter: str | None = Query(None, alias="status"), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Campaign).filter(_campaign_scope(user))
    if search: query = query.filter(Campaign.name.ilike(f"%{search}%"))
    if status_filter: query = query.filter(Campaign.status == status_filter)
    return [_campaign_payload(c, db) for c in query.order_by(Campaign.start_date.desc()).all()]


@router.post("/campaigns", status_code=201)
def create_campaign(payload: CampaignWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user)
    if not _client_is_available(payload.client_id, user, db):
        raise HTTPException(status_code=403, detail="Choose a client assigned to your marketing team.")
    campaign = Campaign(owner_id=user.id, **payload.model_dump(exclude={"platforms"}), platforms=json.dumps(payload.platforms))
    db.add(campaign); db.add(ActivityLog(user_id=user.id, activity="Created campaign")); db.commit(); db.refresh(campaign); return _campaign_payload(campaign, db)


def _owned_campaign(campaign_id: int, user: User, db: Session) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if not campaign or (campaign.owner_id != user.id and campaign.client_id != user.id and user.role != "Administrator"): raise HTTPException(status_code=404, detail="Campaign not found.")
    return campaign


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign = _owned_campaign(campaign_id, user, db); result = _campaign_payload(campaign, db); result["posts"] = [_post_payload(p) for p in db.query(Post).filter(Post.campaign_id == campaign.id).all()]; return result


@router.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: int, payload: CampaignWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); campaign = _owned_campaign(campaign_id, user, db)
    for name, value in payload.model_dump(exclude={"platforms"}).items(): setattr(campaign, name, value)
    campaign.platforms = json.dumps(payload.platforms); db.commit(); return _campaign_payload(campaign, db)


@router.delete("/campaigns/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); campaign = _owned_campaign(campaign_id, user, db); db.query(Post).filter(Post.campaign_id == campaign.id).update({Post.campaign_id: None}); db.delete(campaign); db.commit()


@router.post("/campaigns/{campaign_id}/posts")
def assign_campaign_posts(campaign_id: int, payload: AssignPosts, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); campaign = _owned_campaign(campaign_id, user, db)
    posts = db.query(Post).filter(Post.id.in_(payload.post_ids), Post.owner_id == user.id).all()
    if len(posts) != len(set(payload.post_ids)): raise HTTPException(status_code=422, detail="Posts must belong to you.")
    for post in posts:
        if post.campaign_id and post.campaign_id != campaign.id:
            db.query(CampaignPost).filter(CampaignPost.post_id == post.id).delete()
        post.campaign_id = campaign.id
        if not db.query(CampaignPost).filter_by(campaign_id=campaign.id, post_id=post.id).first(): db.add(CampaignPost(campaign_id=campaign.id, post_id=post.id))
    db.commit(); return _campaign_payload(campaign, db)


@router.delete("/campaigns/{campaign_id}/posts/{post_id}", status_code=204)
def remove_campaign_post(campaign_id: int, post_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_content_access(user); campaign = _owned_campaign(campaign_id, user, db); post = _owned_post(post_id, user, db)
    if post.campaign_id != campaign.id: raise HTTPException(status_code=404, detail="Post is not assigned to this campaign.")
    post.campaign_id = None; db.query(CampaignPost).filter_by(campaign_id=campaign.id, post_id=post.id).delete(); db.commit()
