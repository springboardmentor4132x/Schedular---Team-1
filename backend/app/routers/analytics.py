from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import math
import datetime
import random

from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.models.analytics import (
    PostAnalytics,
    AudienceAnalytics,
    CampaignAnalytics,
    PlatformAnalytics,
)
from app.models.content import Post, Campaign

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def generate_trend_data(db: Session, user: User, days=30):
    from sqlalchemy import func, cast, Date
    from datetime import datetime, timedelta, timezone
    from app.models.content import (
        AnalyticsMetric,
    )  # ensure this is imported or accessible, but it's already imported above

    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    # Query aggregated stats grouped by date
    results = (
        db.query(
            cast(AnalyticsMetric.recorded_at, Date).label("date"),
            func.sum(AnalyticsMetric.reach).label("reach"),
            func.sum(AnalyticsMetric.impressions).label("impressions"),
            func.sum(
                AnalyticsMetric.reactions
                + AnalyticsMetric.comments
                + AnalyticsMetric.shares
            ).label("engagement"),
        )
        .join(Post, Post.id == AnalyticsMetric.post_id)
        .filter(
            Post.owner_id == user.id,
            AnalyticsMetric.recorded_at >= start_date,
            AnalyticsMetric.recorded_at <= end_date,
        )
        .group_by(cast(AnalyticsMetric.recorded_at, Date))
        .all()
    )

    # Create a dictionary for fast lookup
    stats_by_date = {res.date: res for res in results}

    data = []
    for i in range(days - 1, -1, -1):
        target_date = (end_date - timedelta(days=i)).date()
        label = target_date.strftime("%b %d")

        stat = stats_by_date.get(target_date)

        data.append(
            {
                "date": label,
                "reach": int(stat.reach) if stat and stat.reach else 0,
                "impressions": (
                    int(stat.impressions) if stat and stat.impressions else 0
                ),
                "engagement": int(stat.engagement) if stat and stat.engagement else 0,
                "followers": 0,
                "clicks": 0,
                "posts": 0,
            }
        )
    return data


@router.get("")
@router.get("/dashboard")
def get_analytics_dashboard(
    platform: str = Query(None),
    campaign_id: int = Query(None),
    days: int = Query(30),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(
        func.count(PostAnalytics.id).label("total_posts"),
        func.sum(PostAnalytics.impressions).label("total_impressions"),
        func.sum(PostAnalytics.reach).label("total_reach"),
        func.sum(PostAnalytics.likes).label("total_likes"),
        func.sum(PostAnalytics.comments).label("total_comments"),
        func.sum(PostAnalytics.shares).label("total_shares"),
        func.sum(PostAnalytics.clicks).label("total_clicks"),
    )
    if platform:
        query = query.filter(PostAnalytics.platform == platform)

    if campaign_id:
        query = query.join(Post, PostAnalytics.post_id == Post.id).filter(
            Post.campaign_id == campaign_id
        )

    res = query.first()

    total_engagement = (
        (res.total_likes or 0) + (res.total_comments or 0) + (res.total_shares or 0)
    )

    # Followers from platform analytics
    plat_query = db.query(func.sum(PlatformAnalytics.followers).label("followers"))
    if platform:
        plat_query = plat_query.filter(PlatformAnalytics.platform == platform)

    plat_res = plat_query.first()
    total_followers = plat_res.followers or 0

    overall_er = 0
    if res.total_reach and res.total_reach > 0:
        overall_er = round((total_engagement / res.total_reach) * 100, 2)

    return {
        "success": True,
        "data": {
            "totalPublishedPosts": res.total_posts or 0,
            "totalScheduledPosts": 0,
            "totalImpressions": res.total_impressions or 0,
            "totalReach": res.total_reach or 0,
            "totalEngagement": total_engagement,
            "totalLikes": res.total_likes or 0,
            "totalComments": res.total_comments or 0,
            "totalShares": res.total_shares or 0,
            "totalClicks": res.total_clicks or 0,
            "totalFollowers": total_followers,
            "overallEngagementRate": overall_er,
        },
    }


@router.get("/content")
def get_analytics_content(
    platform: str = Query(None),
    campaign_id: int = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = db.query(Post).filter(Post.status == "published").all()
    data = []
    for p in posts:
        if campaign_id and p.campaign_id != campaign_id:
            continue

        pas = db.query(PostAnalytics).filter(PostAnalytics.post_id == p.id).all()
        if platform and not any(pa.platform == platform for pa in pas):
            continue

        if not pas:
            continue

        c = db.query(Campaign).filter(Campaign.id == p.campaign_id).first()
        data.append(
            {
                "id": p.id,
                "caption": p.caption,
                "platforms": [pa.platform for pa in pas],
                "campaign": c.name if c else None,
                "publishedAt": p.updated_at.isoformat() if p.updated_at else None,
                "likes": sum(pa.likes for pa in pas),
                "comments": sum(pa.comments for pa in pas),
                "shares": sum(pa.shares for pa in pas),
                "saves": sum(pa.saves for pa in pas),
                "reach": sum(pa.reach for pa in pas),
                "impressions": sum(pa.impressions for pa in pas),
                "clicks": sum(pa.clicks for pa in pas),
                "engagementRate": round(
                    sum(pa.engagement_rate for pa in pas) / len(pas), 2
                ),
            }
        )
    return {"success": True, "data": data}


@router.get("/audience")
def get_analytics_audience(
    platform: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    aas = db.query(AudienceAnalytics).all()
    if platform:
        aas = [aa for aa in aas if aa.platform == platform]

    if not aas:
        return {"success": True, "data": {}}

    total_followers = sum(aa.followers for aa in aas)
    new_followers = sum(aa.new_followers for aa in aas)
    lost_followers = sum(aa.lost_followers for aa in aas)

    gender_counts = {}
    for aa in aas:
        for g in aa.gender_distribution or []:
            gender_counts[g["name"]] = gender_counts.get(g["name"], 0) + g["value"]

    gtot = sum(gender_counts.values()) or 1
    gender_dist = [
        {"name": k, "value": round(v / gtot * 100)} for k, v in gender_counts.items()
    ]

    age_counts = {}
    for aa in aas:
        for a in aa.age_distribution or []:
            age_counts[a["range"]] = age_counts.get(a["range"], 0) + a["value"]
    atot = sum(age_counts.values()) or 1
    age_dist = [
        {"range": k, "value": round(v / atot * 100)} for k, v in age_counts.items()
    ]

    country_counts = {}
    for aa in aas:
        for c in aa.country_distribution or []:
            country_counts[c["country"]] = (
                country_counts.get(c["country"], 0) + c["value"]
            )
    ctot = sum(country_counts.values()) or 1
    country_dist = [
        {"country": k, "value": round(v / ctot * 100)}
        for k, v in country_counts.items()
    ]

    hours = [0] * 24
    for aa in aas:
        for i, h in enumerate(aa.most_active_hours or [0] * 24):
            hours[i] += h
    hours = [round(h / len(aas)) for h in hours]

    days_counts = {}
    for aa in aas:
        for d in aa.most_active_days or []:
            days_counts[d["day"]] = days_counts.get(d["day"], 0) + d["value"]
    days_dist = [
        {"day": k, "value": round(v / len(aas))} for k, v in days_counts.items()
    ]

    return {
        "success": True,
        "data": {
            "followers": total_followers,
            "newFollowers": new_followers,
            "lostFollowers": lost_followers,
            "netGrowth": new_followers - lost_followers,
            "genderDistribution": gender_dist,
            "ageDistribution": age_dist,
            "countryDistribution": country_dist,
            "mostActiveHours": hours,
            "mostActiveDays": days_dist,
            "followerGrowth": [
                {"month": "Mar", "followers": total_followers - 5000},
                {"month": "Apr", "followers": total_followers - 4000},
                {"month": "May", "followers": total_followers - 3000},
                {"month": "Jun", "followers": total_followers - 2000},
                {"month": "Jul", "followers": total_followers - 1000},
                {"month": "Aug", "followers": total_followers},
            ],
        },
    }


@router.get("/campaigns")
def get_analytics_campaigns(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    campaigns = db.query(CampaignAnalytics, Campaign).join(Campaign).all()
    data = []
    for ca, c in campaigns:
        duration = 0
        if c.end_date and c.start_date:
            duration = (c.end_date - c.start_date).days

        data.append(
            {
                "id": c.id,
                "name": c.name,
                "duration": f"{duration} days",
                "status": c.status,
                "posts": ca.total_posts,
                "reach": ca.reach,
                "impressions": ca.impressions,
                "engagement": ca.engagement,
                "clicks": ca.clicks,
                "roi": ca.roi,
                "completion": ca.completion_percentage,
            }
        )
    return {"success": True, "data": data}


@router.get("/platforms")
def get_analytics_platforms(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    pas = db.query(PlatformAnalytics).all()
    data = {}
    for pa in pas:
        data[pa.platform] = {
            "followers": pa.followers,
            "reach": pa.reach,
            "impressions": pa.impressions,
            "engagement": pa.engagement,
            "likes": int(pa.engagement * 0.7),
            "comments": int(pa.engagement * 0.2),
            "shares": int(pa.engagement * 0.1),
            "clicks": pa.clicks,
        }
    return {"success": True, "data": data}


@router.get("/trends")
def get_analytics_trends(
    days: int = Query(30),
    platform: str = Query(None),
    campaign_id: int = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "success": True,
        "message": "Trend data retrieved successfully",
        "data": generate_trend_data(db, user, days),
    }


@router.get("/top-posts")
def get_analytics_top_posts(
    limit: int = Query(5),
    sort_by: str = Query("engagement"),
    platform: str = Query(None),
    campaign_id: int = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = db.query(Post).filter(Post.owner_id == user.id, Post.status == "published").all()
    data = []
    for p in posts:
        if campaign_id and p.campaign_id != campaign_id:
            continue
        pas = db.query(PostAnalytics).filter(PostAnalytics.post_id == p.id).all()
        if platform and not any(pa.platform == platform for pa in pas):
            continue
        if not pas:
            continue
        c = db.query(Campaign).filter(Campaign.id == p.campaign_id).first()
        data.append({
            "id": p.id,
            "caption": p.caption,
            "platforms": [pa.platform for pa in pas],
            "campaign": c.name if c else None,
            "publishedAt": p.updated_at.isoformat() if p.updated_at else None,
            "engagement": sum(pa.likes + pa.comments + pa.shares for pa in pas),
            "reach": sum(pa.reach for pa in pas)
        })
    
    data.sort(key=lambda x: x.get(sort_by, 0) or 0, reverse=True)
    return {"success": True, "data": data[:limit]}


@router.get("/top-campaigns")
def get_analytics_top_campaigns(
    limit: int = Query(5),
    sort_by: str = Query("engagement"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaigns = db.query(CampaignAnalytics, Campaign).join(Campaign).filter(Campaign.owner_id == user.id).all()
    data = []
    for ca, c in campaigns:
        data.append({
            "id": c.id,
            "name": c.name,
            "engagement": ca.engagement or 0,
            "roi": ca.roi or 0,
            "completion": ca.completion_percentage or 0
        })
    
    data.sort(key=lambda x: x.get(sort_by, 0) or 0, reverse=True)
    return {"success": True, "data": data[:limit]}
