"""Dependency-free integration tests for the core role and lifecycle matrix.

They call router functions with an isolated SQLite database so the suite runs
without a running server or external social credentials.
"""
import os
import unittest
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")

from fastapi import HTTPException
from app.database import Base, SessionLocal, engine
from app.models.user import ClientAssignment, SocialAccount, Team, User
from app.routers.content import create_campaign, create_post, get_post, schedule_post
from app.schemas.content_schema import CampaignWrite, PostWrite, ScheduleWrite
from app.services.auth_service import get_password_hash


class BackendFlowTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        self.db = SessionLocal()
        self.marketing = self._user("Marketing", "marketing@example.com", "Marketing Team")
        self.business = self._user("Business", "business@example.com", "Business User")
        self.other_business = self._user("Other", "other@example.com", "Business User")
        self.creator = self._user("Creator", "creator@example.com", "Content Creator")
        team = Team(name="Growth", owner_id=self.marketing.id)
        self.db.add(team); self.db.commit(); self.db.refresh(team)
        self.db.add(ClientAssignment(team_id=team.id, business_user_id=self.business.id)); self.db.commit()

    def tearDown(self):
        self.db.close()

    def _user(self, name, email, role):
        user = User(full_name=name, email=email, phone=email, password=get_password_hash("password123"), role=role)
        self.db.add(user); self.db.commit(); self.db.refresh(user)
        return user

    def test_business_cannot_create_campaign(self):
        payload = CampaignWrite(name="Launch", objective="Awareness", start_date=datetime.now(timezone.utc), end_date=datetime.now(timezone.utc) + timedelta(days=1))
        with self.assertRaises(HTTPException) as error:
            create_campaign(payload, self.business, self.db)
        self.assertEqual(error.exception.status_code, 403)

    def test_marketing_cannot_create_for_unassigned_client(self):
        payload = PostWrite(caption="Hello", platforms=["instagram"], client_id=self.other_business.id)
        with self.assertRaises(HTTPException) as error:
            create_post(payload, self.marketing, self.db)
        self.assertEqual(error.exception.status_code, 403)

    def test_creator_cannot_read_another_creators_post(self):
        post = create_post(PostWrite(caption="Personal", platforms=["instagram"]), self.creator, self.db)
        second_creator = self._user("Creator Two", "creator2@example.com", "Content Creator")
        with self.assertRaises(HTTPException) as error:
            get_post(post["id"], second_creator, self.db)
        self.assertEqual(error.exception.status_code, 404)

    def test_past_schedule_is_rejected(self):
        post = create_post(PostWrite(caption="Scheduled", platforms=["instagram"]), self.creator, self.db)
        self.db.add(SocialAccount(user_id=self.creator.id, platform="instagram", status="connected", permissions="")); self.db.commit()
        with self.assertRaises(HTTPException) as error:
            schedule_post(post["id"], ScheduleWrite(scheduled_for=datetime.now(timezone.utc) - timedelta(minutes=1)), self.creator, self.db)
        self.assertEqual(error.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()
