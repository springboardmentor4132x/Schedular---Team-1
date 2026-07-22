from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.content_model import Campaign, CampaignPost, Post
from app.campaign_schema import CampaignCreate, CampaignResponse, AssignPostsRequest

router = APIRouter(prefix="/campaigns", tags=["Campaign Management"])


@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(campaign_data: CampaignCreate, db: Session = Depends(get_db)):
    new_campaign = Campaign(
        user_id=1,  # Hardcoded temporarily until JWT current_user dependency is attached
        name=campaign_data.name,
        description=campaign_data.description,
        objective=campaign_data.objective,
        budget=campaign_data.budget,
        start_date=campaign_data.start_date,
        end_date=campaign_data.end_date,
        status="active"
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign


@router.get("/", response_model=List[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).all()


@router.post("/{campaign_id}/assign-posts")
def assign_posts_to_campaign(campaign_id: int, request: AssignPostsRequest, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    for p_id in request.post_ids:
        association = CampaignPost(campaign_id=campaign_id, post_id=p_id)
        db.add(association)

    db.commit()
    return {"message": f"Successfully assigned {len(request.post_ids)} posts to campaign '{campaign.name}'"}


@router.get("/{campaign_id}/analytics")
def get_campaign_analytics(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    assigned_post_ids = db.query(CampaignPost.post_id).filter(CampaignPost.campaign_id == campaign_id).all()
    p_ids = [p[0] for p in assigned_post_ids]

    total_posts = len(p_ids)
    published_count = db.query(Post).filter(Post.id.in_(p_ids),
                                            Post.publishing_status == "published").count() if p_ids else 0
    scheduled_count = db.query(Post).filter(Post.id.in_(p_ids),
                                            Post.publishing_status == "scheduled").count() if p_ids else 0

    completion_percentage = (published_count / total_posts * 100) if total_posts > 0 else 0.0

    return {
        "campaign_name": campaign.name,
        "total_posts": total_posts,
        "published_posts": published_count,
        "scheduled_posts": scheduled_count,
        "completion_percentage": round(completion_percentage, 2),
        "status": campaign.status
    }