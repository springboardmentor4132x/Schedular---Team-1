from fastapi import FastAPI

from app.database import Base, engine
from app.models.user import User
from app.routers.auth import router as auth_router

app = FastAPI(
    title="SocialPilot API",
    version="1.0"
)

app.include_router(auth_router)


@app.get("/")
def home():
    return {
        "message": "SocialPilot Backend Running"
    }