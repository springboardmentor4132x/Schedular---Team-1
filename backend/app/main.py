from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.models.user import User
from app.config import settings
from app.core.errors import (
    http_error_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.content import router as content_router
from app.routers.teams import router as teams_router
from app.routers.insights import router as insights_router
from app.routers.publishing import router as publishing_router
from app.routers.analytics import router as analytics_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.profile import router as profile_router
from app.routers.settings import router as settings_router
from app.routers.admin import router as admin_router

app = FastAPI(title="SocialPilot API", version="1.0")
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)

# Enable CORS for frontend API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL.rstrip("/")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(content_router)
app.include_router(teams_router)
app.include_router(insights_router)
app.include_router(publishing_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(profile_router)
app.include_router(settings_router)
app.include_router(admin_router)
upload_directory = Path(__file__).resolve().parents[1] / "uploads"
upload_directory.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_directory), name="uploads")


def backfill_marketing_teams():
    from app.database import SessionLocal
    from app.models.user import User, Team, TeamMember

    db = SessionLocal()
    try:
        marketing_users = db.query(User).filter(User.role == "Marketing Team").all()
        for mu in marketing_users:
            existing_team = db.query(Team).filter(Team.owner_id == mu.id).first()
            if not existing_team:
                team_name = f"{mu.full_name}'s Workspace"
                default_team = Team(name=team_name, owner_id=mu.id)
                db.add(default_team)
                db.commit()
                db.refresh(default_team)
                db.add(
                    TeamMember(
                        team_id=default_team.id, user_id=mu.id, role="Marketing Team"
                    )
                )
                db.commit()
                print(
                    f"Backfilled default team '{team_name}' for marketing user '{mu.full_name}'"
                )
            else:
                if existing_team.name == "SocialPilot":
                    existing_team.name = f"{mu.full_name}'s Workspace"
                    db.commit()
                    print(
                        f"Updated generic team name to '{existing_team.name}' for marketing user '{mu.full_name}'"
                    )
    except Exception as e:
        print(f"Failed backfilling teams: {e}")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    backfill_marketing_teams()


@app.on_event("shutdown")
async def shutdown_event():
    pass


@app.get("/")
def home():
    return {"message": "SocialPilot Backend Running"}
