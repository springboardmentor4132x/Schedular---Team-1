from fastapi import FastAPI

from app.auth import router as auth_router
from app.database import engine, Base
import app.user  # Must be imported so SQLAlchemy knows about the table

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Schedular API")

# Register the authentication endpoints
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Schedular API"}