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

    def test_discovery_and_requests(self):
        from app.routers.teams import discover_marketing_teams, discover_business_users, create_collaboration_request, decide_collaboration_request
        from app.schemas.team_schema import CollaborationRequestCreate, CollaborationDecision

        # 1. Discover Marketing Teams
        teams = discover_marketing_teams(self.other_business, self.db)
        self.assertEqual(len(teams), 1)
        self.assertEqual(teams[0]["name"], "Growth")

        # 2. Discover Business Users
        businesses = discover_business_users(self.marketing, self.db)
        # self.business is already assigned, so only self.other_business remains
        self.assertEqual(len(businesses), 1)
        self.assertEqual(businesses[0]["id"], self.other_business.id)

        # 3. Create Collaboration Request (Business -> Marketing)
        req = create_collaboration_request(CollaborationRequestCreate(team_id=1), self.other_business, self.db)
        self.assertEqual(req["status"], "pending")
        self.assertEqual(req["requestedByUserId"], self.other_business.id)

        # 4. Duplicate request prevention
        with self.assertRaises(HTTPException) as error:
            create_collaboration_request(CollaborationRequestCreate(team_id=1), self.other_business, self.db)
        self.assertEqual(error.exception.status_code, 409)

        # 5. Acceptance checks
        resolved = decide_collaboration_request(req["id"], CollaborationDecision(status="accepted"), self.marketing, self.db)
        self.assertEqual(resolved["status"], "accepted")

        # Check ClientAssignment created
        assignment = self.db.query(ClientAssignment).filter_by(team_id=1, business_user_id=self.other_business.id).first()
        self.assertIsNotNone(assignment)

        # 6. Duplicate assignment prevention
        with self.assertRaises(HTTPException) as error:
            create_collaboration_request(CollaborationRequestCreate(team_id=1), self.other_business, self.db)
        self.assertEqual(error.exception.status_code, 409)

        # 7. Marketing -> Business Request
        marketing2 = self._user("Marketing 2", "m2@example.com", "Marketing Team")
        team2 = Team(name="M2 Workspace", owner_id=marketing2.id)
        self.db.add(team2); self.db.commit(); self.db.refresh(team2)
        
        req2 = create_collaboration_request(CollaborationRequestCreate(business_user_id=self.business.id), marketing2, self.db)
        self.assertEqual(req2["status"], "pending")
        self.assertEqual(req2["requestedByUserId"], marketing2.id)

        # Decide/Accept by Business User
        resolved2 = decide_collaboration_request(req2["id"], CollaborationDecision(status="accepted"), self.business, self.db)
        self.assertEqual(resolved2["status"], "accepted")

        # Check ClientAssignment created
        assignment2 = self.db.query(ClientAssignment).filter_by(team_id=team2.id, business_user_id=self.business.id).first()
        self.assertIsNotNone(assignment2)

    def test_clients_and_campaigns_isolation(self):
        from app.routers.teams import list_client_workspaces
        from app.routers.content import list_campaigns, create_campaign
        from app.schemas.content_schema import CampaignWrite

        # 1. GET /clients authorization / isolation
        clients = list_client_workspaces(self.marketing, self.db)
        self.assertEqual(len(clients), 1)
        self.assertEqual(clients[0]["id"], self.business.id)

        # 2. Campaign client authorization and cross-role visibility
        payload = CampaignWrite(
            name="Winter Sale",
            objective="Awareness",
            platforms=["instagram"],
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=1),
            client_id=self.business.id
        )
        camp = create_campaign(payload, self.marketing, self.db)
        self.assertEqual(camp["name"], "Winter Sale")

        # Business user should see it
        biz_campaigns = list_campaigns(search=None, status_filter=None, client_id=None, user=self.business, db=self.db)
        self.assertEqual(len(biz_campaigns), 1)
        self.assertEqual(biz_campaigns[0]["id"], camp["id"])

        # Creator cannot create campaign for a client without access
        with self.assertRaises(HTTPException) as error:
            create_campaign(payload, self.creator, self.db)
        self.assertEqual(error.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
