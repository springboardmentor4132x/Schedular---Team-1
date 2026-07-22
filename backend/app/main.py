from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router

from app.routers.post import router as post_router


app = FastAPI(
    title="SocialPilot API",
    version="1.0"
)

# Create tables
Base.metadata.create_all(bind=engine)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(dashboard_router)

app.include_router(post_router)

@app.get("/")
def home():
    return {
        "message": "SocialPilot Backend Running"
    }