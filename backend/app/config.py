from pathlib import Path

from pydantic import Field
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
    # Tokens are encrypted at rest.  There is intentionally no development
    # fallback: a process that cannot protect tokens must not connect accounts.
    ENCRYPTION_KEY: str | None = None
    CELERY_TASK_ALWAYS_EAGER: bool = False
    PUBLISH_MAX_RETRIES: int = Field(default=3, ge=0, le=10)
    PUBLISH_RETRY_SECONDS: int = Field(default=60, ge=1, le=3600)
    MEDIA_PUBLIC_BASE_URL: str | None = None

    # Optional delivery integrations.  When they are absent, in-app
    # notifications still persist, while email/push are explicitly unavailable.
    SMTP_HOST: str | None = None
    SMTP_PORT: int = Field(default=587, ge=1, le=65535)
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        extra="ignore",
    )


settings = Settings()
