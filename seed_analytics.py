from datetime import datetime
from app.database import SessionLocal, engine, Base
# Imports from content_model
from app.content_model import PostAnalytics, AudienceAnalytics, PlatformAnalytics, Post
# Imports from user
from app.user import PlatformConnection, User

# Initialize database
Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed_data():
    print("Seeding sample data for review...")

    # 1. Ensure test user exists
    user = db.query(User).filter_by(email="test@example.com").first()
    if not user:
        user = User(email="test@example.com", password_hash="hashed_pw", role="Content Creator")
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Add Platform Connection
    connection = db.query(PlatformConnection).filter_by(user_id=user.id).first()
    if not connection:
        connection = PlatformConnection(
            user_id=user.id,
            platform="LinkedIn",
            access_token="mock_token",
            connected_account_name="Harsh Sharma"
        )
        db.add(connection)
        db.commit()
        db.refresh(connection)

    # 3. Add Sample Post
    post = db.query(Post).filter_by(user_id=user.id).first()
    if not post:
        post = Post(user_id=user.id, content="Excited to launch our new social media analytics platform!",
                    created_at=datetime.utcnow())
        db.add(post)
        db.commit()
        db.refresh(post)

    # 4. Add Post Analytics
    if not db.query(PostAnalytics).filter_by(post_id=post.id).first():
        post_analytics = PostAnalytics(
            post_id=post.id,
            platform="LinkedIn",
            likes=142,
            comments=28,
            shares=12,
            saves=19,
            reach=2450,
            impressions=3800,
            clicks=115,
            engagement_rate=5.3,
            last_synced=datetime.utcnow()
        )
        db.add(post_analytics)

    # 5. Add Audience Analytics
    if not db.query(AudienceAnalytics).filter_by(platform_connection_id=connection.id).first():
        audience = AudienceAnalytics(
            platform_connection_id=connection.id,
            followers=5200,
            new_followers=340,
            lost_followers=12,
            gender_distribution={"Male": "58%", "Female": "40%", "Other": "2%"},
            age_distribution={"18-24": 450, "25-34": 2800, "35-44": 1200, "45+": 750},
            location_data={"India": 3200, "USA": 1100, "UK": 500, "Others": 400}
        )
        db.add(audience)

    # 6. Add Platform Overview Analytics
    platforms = [
        {"name": "LinkedIn", "followers": 5200, "reach": 18400, "engagement": 1250, "impressions": 29000,
         "clicks": 840},
        {"name": "Instagram", "followers": 8900, "reach": 34000, "engagement": 3100, "impressions": 52000,
         "clicks": 1420},
        {"name": "Twitter", "followers": 3100, "reach": 9200, "engagement": 620, "impressions": 14000, "clicks": 310}
    ]

    for p in platforms:
        if not db.query(PlatformAnalytics).filter_by(platform_name=p["name"]).first():
            db.add(PlatformAnalytics(
                platform_name=p["name"],
                followers=p["followers"],
                reach=p["reach"],
                engagement=p["engagement"],
                impressions=p["impressions"],
                clicks=p["clicks"]
            ))

    db.commit()
    print("Database seeded successfully! Frontend graphs will now show real data.")


if __name__ == "__main__":
    seed_data()
    db.close()