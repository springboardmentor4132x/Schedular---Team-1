from datetime import datetime, timezone
from app.database import SessionLocal, engine, Base
from app.content_model import Notification, NotificationPreference, GeneratedReport
from app.user import User

# Initialize database
Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed_final_data():
    print("Seeding Module 7 (Notifications) and Module 8 (Reports) mock data...")

    # 1. Fetch our test user
    user = db.query(User).filter_by(email="test@example.com").first()
    if not user:
        print("User not found. Please run seed_analytics.py first.")
        return

    # 2. Add Notification Preferences
    if not db.query(NotificationPreference).filter_by(user_id=user.id).first():
        prefs = NotificationPreference(
            user_id=user.id,
            email_frequency="Daily"
        )
        db.add(prefs)

    # 3. Add Mock Notifications
    if db.query(Notification).count() == 0:
        notifications = [
            Notification(user_id=user.id, title="Post Published!",
                         description="Your post on LinkedIn was successfully published.", category="Publishing",
                         notification_type="Success", status="Unread"),
            Notification(user_id=user.id, title="Token Expiring",
                         description="Your Facebook access token will expire in 2 days. Please reauthorize.",
                         category="Account Activity", notification_type="Alert", status="Unread"),
            Notification(user_id=user.id, title="New Task Assigned",
                         description="You have been assigned to review the 'Summer Sale' campaign.",
                         category="Team Collaboration", notification_type="Assignment", status="Read",
                         read_at=datetime.now(timezone.utc))
        ]
        db.add_all(notifications)

    # 4. Add Mock Generated Reports
    if db.query(GeneratedReport).count() == 0:
        reports = [
            GeneratedReport(user_id=user.id, report_name="July Engagement Overview", report_type="Engagement",
                            export_format="PDF", status="Completed", file_location="/downloads/reports/july_eng.pdf",
                            download_count=2),
            GeneratedReport(user_id=user.id, report_name="Platform Comparison Q2", report_type="Platform Comparison",
                            export_format="Excel", status="Processing", download_count=0)
        ]
        db.add_all(reports)

    db.commit()
    print("Final module data seeded successfully! The frontend dashboards are unblocked.")


if __name__ == "__main__":
    seed_final_data()
    db.close()