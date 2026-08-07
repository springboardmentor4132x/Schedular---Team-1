"""Token encryption, decryption, and refresh utilities.

Extracted from dashboard.py to be reusable across publishing services.
"""

import base64
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from cryptography.fernet import Fernet
from fastapi import HTTPException
from sqlalchemy.orm import Session
import httpx

from app.config import settings
from app.models.user import SocialAccount

logger = logging.getLogger(__name__)


def _token_cipher() -> Fernet:
    """Generate Fernet cipher from SECRET_KEY."""
    key = base64.urlsafe_b64encode(
        hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    )
    return Fernet(key)


def encrypt_token(value: str | None) -> str | None:
    """Encrypt a token using Fernet symmetric encryption."""
    return (
        _token_cipher().encrypt(value.encode("utf-8")).decode("utf-8")
        if value
        else None
    )


def decrypt_token(value: str | None) -> str | None:
    """Decrypt a token using Fernet symmetric encryption."""
    return (
        _token_cipher().decrypt(value.encode("utf-8")).decode("utf-8")
        if value
        else None
    )


async def ensure_valid_token(db: Session, account: SocialAccount) -> str:
    """Ensure token is valid, refreshing if within 10 minutes of expiry.

    Args:
        db: Database session
        account: SocialAccount with encrypted tokens

    Returns:
        Valid access token (plaintext)

    Raises:
        HTTPException: If token expired and refresh not possible
    """
    access_token = decrypt_token(account.access_token_encrypted)

    logger.info(
        "Token check for SocialAccount id=%s (%s): access_token_found=%s expires_at=%s",
        account.id,
        account.platform,
        bool(access_token),
        account.token_expires_at,
    )

    # Check if token is still valid for at least 10 minutes
    if account.token_expires_at:
        now = datetime.now(timezone.utc)
        is_expired = account.token_expires_at <= now
        logger.info(
            "SocialAccount id=%s token expired=%s (needs_refresh=%s)",
            account.id,
            is_expired,
            account.token_expires_at <= now + timedelta(minutes=10),
        )
        if account.token_expires_at > now + timedelta(minutes=10):
            return access_token  # Token is still fresh
    else:
        logger.info(
            "SocialAccount id=%s has no token_expires_at; will attempt refresh",
            account.id,
        )

    # Token expired or expiring soon - attempt refresh
    refresh_token = decrypt_token(account.refresh_token_encrypted)

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail=f"{account.platform} token expired and no refresh token available. User must reconnect."
        )

    # LinkedIn token refresh
    if account.platform == "linkedin":
        new_token_data = await _refresh_linkedin_token(refresh_token)
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Token refresh not yet implemented for {account.platform}"
        )

    # Update account with new token
    account.access_token_encrypted = encrypt_token(new_token_data["access_token"])
    if "refresh_token" in new_token_data:
        account.refresh_token_encrypted = encrypt_token(new_token_data["refresh_token"])
    if "expires_in" in new_token_data:
        account.token_expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=int(new_token_data["expires_in"])
        )
    account.last_sync = datetime.now(timezone.utc)
    db.commit()

    return new_token_data["access_token"]


async def _refresh_linkedin_token(refresh_token: str) -> dict:
    """Refresh LinkedIn access token.

    Args:
        refresh_token: LinkedIn refresh token

    Returns:
        Token data with access_token, refresh_token (optional), expires_in
    """
    client_id = settings.LINKEDIN_CLIENT_ID
    client_secret = settings.LINKEDIN_CLIENT_SECRET

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500,
            detail="LinkedIn OAuth credentials not configured"
        )

    token_url = "https://www.linkedin.com/oauth/v2/accessToken"

    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            # Preserve LinkedIn's exact status and response body for diagnosis.
            body = exc.response.text if exc.response is not None else str(exc)
            status_code = exc.response.status_code if exc.response is not None else "unknown"
            logger.error(
                "LinkedIn token refresh failed: status=%s body=%s",
                status_code,
                body,
            )
            raise HTTPException(
                status_code=502,
                detail=f"LinkedIn token refresh failed ({status_code}): {body}",
            ) from exc
        except httpx.HTTPError as exc:
            logger.error("LinkedIn token refresh request error: %s", exc)
            raise HTTPException(
                status_code=502,
                detail=f"LinkedIn token refresh request error: {exc}",
            ) from exc
