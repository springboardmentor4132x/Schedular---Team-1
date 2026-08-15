import sys
import os
import random
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database import SessionLocal
from app.models.content import Post, Campaign
from app.models.analytics import (
    PostAnalytics,
    AudienceAnalytics,
    CampaignAnalytics,
    PlatformAnalytics,
)


def seed_analytics():
    db = SessionLocal()
    try:
        # Seed Platform Analytics & Audience Analytics
        platforms = ["facebook", "instagram", "linkedin", "twitter"]
        for plat in platforms:
            if not db.query(PlatformAnalytics).filter_by(platform=plat).first():
                followers = random.randint(1000, 50000)
                reach = followers * random.uniform(0.5, 3.0)
                pa = PlatformAnalytics(
                    platform=plat,
                    followers=followers,
                    reach=int(reach),
                    impressions=int(reach * 1.5),
                    engagement=int(reach * 0.1),
                    clicks=int(reach * 0.05),
                )
                db.add(pa)

            if not db.query(AudienceAnalytics).filter_by(platform=plat).first():
                aa = AudienceAnalytics(
                    platform=plat,
                    followers=random.randint(1000, 50000),
                    new_followers=random.randint(10, 500),
                    lost_followers=random.randint(0, 100),
                    gender_distribution=[
                        {"name": "Female", "value": random.randint(30, 60)},
                        {"name": "Male", "value": random.randint(30, 50)},
                        {"name": "Other", "value": random.randint(1, 10)},
                    ],
                    age_distribution=[
                        {"range": "18-24", "value": random.randint(10, 30)},
                        {"range": "25-34", "value": random.randint(30, 50)},
                        {"range": "35-44", "value": random.randint(10, 20)},
                    ],
                    country_distribution=[
                        {"country": "United States", "value": random.randint(40, 60)},
                        {"country": "United Kingdom", "value": random.randint(10, 20)},
                        {"country": "India", "value": random.randint(5, 15)},
                    ],
                    most_active_hours=[random.randint(10, 100) for _ in range(24)],
                    most_active_days=[
                        {"day": "Mon", "value": random.randint(50, 100)},
                        {"day": "Tue", "value": random.randint(50, 100)},
                        {"day": "Wed", "value": random.randint(50, 100)},
                        {"day": "Thu", "value": random.randint(50, 100)},
                        {"day": "Fri", "value": random.randint(50, 100)},
                        {"day": "Sat", "value": random.randint(50, 100)},
                        {"day": "Sun", "value": random.randint(50, 100)},
                    ],
                )
                db.add(aa)

        # Seed Post Analytics for existing posts
        posts = db.query(Post).filter(Post.status == "published").all()
        for p in posts:
            import json

            plats = (
                json.loads(p.platforms) if isinstance(p.platforms, str) else p.platforms
            )
            if not plats:
                plats = ["linkedin"]
            for plat in plats:
                if (
                    not db.query(PostAnalytics)
                    .filter_by(post_id=p.id, platform=plat)
                    .first()
                ):
                    reach = random.randint(100, 10000)
                    pa = PostAnalytics(
                        post_id=p.id,
                        platform=plat,
                        likes=int(reach * 0.05),
                        comments=int(reach * 0.01),
                        shares=int(reach * 0.005),
                        saves=int(reach * 0.002),
                        reach=reach,
                        impressions=int(reach * 1.2),
                        clicks=int(reach * 0.02),
                        engagement_rate=round(random.uniform(1.5, 10.0), 2),
                    )
                    db.add(pa)

        # Seed Campaign Analytics
        campaigns = db.query(Campaign).all()
        for c in campaigns:
            if not db.query(CampaignAnalytics).filter_by(campaign_id=c.id).first():
                reach = random.randint(10000, 500000)
                ca = CampaignAnalytics(
                    campaign_id=c.id,
                    total_posts=random.randint(5, 50),
                    reach=reach,
                    impressions=int(reach * 1.4),
                    engagement=int(reach * 0.08),
                    clicks=int(reach * 0.04),
                    roi=round(random.uniform(50, 500), 2),
                    completion_percentage=round(random.uniform(10, 100), 1),
                )
                db.add(ca)

        db.commit()
        print("Analytics seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding analytics: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_analytics()
