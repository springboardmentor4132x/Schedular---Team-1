from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    APP_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    LINKEDIN_CLIENT_ID: str | None = None
    LINKEDIN_CLIENT_SECRET: str | None = None
    YOUTUBE_CLIENT_ID: str | None = None
    YOUTUBE_CLIENT_SECRET: str | None = None
    X_CLIENT_ID: str | None = None
    X_CLIENT_SECRET: str | None = None
    X_REDIRECT_URI: str | None = None
    FACEBOOK_CLIENT_ID: str | None = None
    FACEBOOK_CLIENT_SECRET: str | None = None
    INSTAGRAM_CLIENT_ID: str | None = None
    INSTAGRAM_CLIENT_SECRET: str | None = None
    PINTEREST_CLIENT_ID: str | None = None
    PINTEREST_CLIENT_SECRET: str | None = None

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    ENCRYPTION_KEY: str = "your-32-byte-fernet-key-here-must-be-secure="

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        extra="ignore",
    )


settings = Settings()
