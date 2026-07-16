import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# NOTE: Member 3 owns the real PostgreSQL connection string.
# This defaults to SQLite so Member 4 (auth) can build/test independently,
# but reads DATABASE_URL from the environment so it's a one-line swap
# to plug into the shared Postgres DB once Member 3's setup is merged.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./socialpilot.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
