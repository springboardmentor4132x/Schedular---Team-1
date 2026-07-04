from fastapi import FastAPI

from app.database import Base, engine

from app.models.user import User

app = FastAPI(
    title="SocialPilot API",
    version="1.0"
)


@app.get("/")
def home():
    return {
        "message": "SocialPilot Backend Running"
    }