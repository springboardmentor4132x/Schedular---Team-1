import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import logging

from app.database import get_db
from app.models.user import User, SocialAccount, ActivityLog
from app.services.auth_service import get_current_user
from app.integrations.social.linkedin import LinkedInProvider
from app.integrations.social.facebook import FacebookProvider
from app.integrations.social.instagram import InstagramProvider
from app.integrations.social.x import XProvider
from app.integrations.social.youtube import YouTubeProvider
from app.integrations.social.pinterest import PinterestProvider

import logging

logger = logging.getLogger(__name__)


def get_provider(platform: str):
    providers = {
        "linkedin": LinkedInProvider,
        "facebook": FacebookProvider,
        "instagram": InstagramProvider,
        "x": XProvider,
        "youtube": YouTubeProvider,
        "pinterest": PinterestProvider,
    }
    if platform not in providers:
        return None
    return providers[platform]()


router = APIRouter(prefix="/oauth", tags=["Social Accounts & OAuth"])

# Simple in-memory state store for CSRF protection.
# In a real cluster, this should be stored in Redis.
oauth_states = {}


@router.get("/login/{platform}")
def oauth_login(platform: str, user: User = Depends(get_current_user)):
    """Initiates the OAuth 2.0 flow for a given platform."""
    state = secrets.token_urlsafe(32)

    # Example Redirect URI
    redirect_uri = f"http://localhost:8000/oauth/callback/{platform}"

    auth_url = ""
    provider = get_provider(platform)
    if not provider:
        raise HTTPException(status_code=400, detail="Unsupported platform.")
    auth_url = provider.get_authorization_url(state, redirect_uri)

    # Store state to validate on callback
    oauth_states[state] = user.id

    return {"auth_url": auth_url}


@router.get("/callback/{platform}")
def oauth_callback(
    platform: str,
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: Session = Depends(get_db),
):
    """Handles the OAuth 2.0 callback, exchanges the code, and stores the encrypted token."""
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")

    if not code or not state:
        raise HTTPException(
            status_code=400, detail="Missing code or state in callback."
        )

    user_id = oauth_states.pop(state, None)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid or expired CSRF state.")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    redirect_uri = f"http://localhost:8000/oauth/callback/{platform}"

    try:
        provider = get_provider(platform)
        if not provider:
            raise HTTPException(status_code=400, detail="Unsupported platform.")

        access_token, refresh_token, expires_in = provider.exchange_code(
            code, redirect_uri
        )
        account_info = provider.get_account_info(access_token)

        # Store or update the social account
        account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user.id, SocialAccount.platform == platform
            )
            .first()
        )

        if not account:
            account = SocialAccount(user_id=user.id, platform=platform)
            db.add(account)

        account.status = "connected"
        account.account_name = account_info.get("name")
        account.account_email = account_info.get("email")
        account.access_token_encrypted = access_token
        account.refresh_token_encrypted = refresh_token

        if expires_in:
            account.token_expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=expires_in
            )

        db.add(ActivityLog(user_id=user.id, activity=f"Connected {platform} account"))
        db.commit()

        # In a real app, this might redirect to the frontend dashboard.
        return {
            "success": True,
            "message": f"Successfully connected {platform} account.",
        }

    except Exception as e:
        logger.error(f"Failed to connect {platform} account: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to connect social account.")
