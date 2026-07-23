from fastapi import FastAPI
from app.database import engine, Base

# Import all models so SQLAlchemy registers their tables
import app.user
import app.content_model

# Import routers
from app.auth import router as auth_router
from app.posts import router as posts_router
from app.campaigns import router as campaigns_router

# Automatically create all tables in socialpilot.db
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SocialPilot API")

# Register routers
app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(campaigns_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the SocialPilot API"}