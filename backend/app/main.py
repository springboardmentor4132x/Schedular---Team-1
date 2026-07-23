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
upload_directory = Path(__file__).resolve().parents[1] / "uploads"
upload_directory.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_directory), name="uploads")


@app.get("/")
def home():
    return {"message": "SocialPilot Backend Running"}
