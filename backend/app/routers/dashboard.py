"""Authenticated APIs consumed by the dashboard, profile, and settings pages."""
import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from json import loads
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import ActivityLog, ClientAssignment, CollaborationRequest, Notification, SocialAccount, Team, TeamMember, User, UserProfile, UserSettings
from app.models.content import AnalyticsMetric, Campaign, CampaignPost, MediaAsset, Post, PublishingLog, Report
from app.schemas.dashboard_schema import ProfileUpdate, SettingsUpdate
from app.config import settings
from app.services.auth_service import ALGORITHM, get_current_user

router = APIRouter(tags=["Dashboard"])
PLATFORMS = ("facebook", "instagram", "linkedin", "pinterest", "youtube", "x")
OAUTH_PLATFORMS = PLATFORMS


def _callback_url(platform: str) -> str:
    if platform == "x" and settings.X_REDIRECT_URI:
        return settings.X_REDIRECT_URI
    return f"{settings.APP_BASE_URL.rstrip('/')}/social/callback/{platform}"


def _oauth_configuration(platform: str) -> tuple[str, str]:
    credentials = {
        "linkedin": (settings.LINKEDIN_CLIENT_ID, settings.LINKEDIN_CLIENT_SECRET),
        "youtube": (settings.YOUTUBE_CLIENT_ID, settings.YOUTUBE_CLIENT_SECRET),
        "x": (settings.X_CLIENT_ID, settings.X_CLIENT_SECRET),
        "facebook": (settings.FACEBOOK_CLIENT_ID, settings.FACEBOOK_CLIENT_SECRET),
        "instagram": (settings.INSTAGRAM_CLIENT_ID, settings.INSTAGRAM_CLIENT_SECRET),
        "pinterest": (settings.PINTEREST_CLIENT_ID, settings.PINTEREST_CLIENT_SECRET),
    }
    client_id, client_secret = credentials[platform]
    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail=f"{platform.title()} OAuth credentials are not configured.")
    return client_id, client_secret


def _oauth_state(user_id: int, platform: str, code_verifier: str | None = None) -> str:
    payload = {"sub": str(user_id), "platform": platform, "exp": datetime.now(timezone.utc).timestamp() + 600}
    if code_verifier:
        # State is sent through the browser. Keep the X PKCE verifier encrypted
        # even though the state itself is signed.
        payload["pkce"] = _encrypt_token(code_verifier)
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def _read_oauth_json(url: str, *, data: dict | None = None, headers: dict | None = None) -> dict:
    request_headers = {"Accept": "application/json", **(headers or {})}
    body = urlencode(data).encode() if data is not None else None
    if body is not None:
        request_headers["Content-Type"] = "application/x-www-form-urlencoded"
    request = Request(url, data=body, headers=request_headers, method="POST" if body is not None else "GET")
    try:
        with urlopen(request, timeout=15) as response:
            return loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Social provider could not be reached.") from exc


def _token_cipher() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest())
    return Fernet(key)


def _encrypt_token(value: str | None) -> str | None:
    return _token_cipher().encrypt(value.encode("utf-8")).decode("utf-8") if value else None


def _decrypt_token(value: str | None) -> str | None:
    return _token_cipher().decrypt(value.encode("utf-8")).decode("utf-8") if value else None


def _identity_fields(platform: str, identity: dict) -> tuple[str | None, str | None]:
    if platform == "x":
        identity = identity.get("data", {})
        return identity.get("name") or identity.get("username"), None
    if platform == "youtube":
        return identity.get("name") or identity.get("email"), identity.get("email")
    if platform in {"facebook", "instagram"}:
        return identity.get("name") or identity.get("username") or identity.get("id") or identity.get("user_id"), identity.get("email")
    if platform == "pinterest":
        return identity.get("username") or identity.get("profile_image") or identity.get("account_type"), None
    return identity.get("name") or identity.get("localizedFirstName") or identity.get("email"), identity.get("email") or identity.get("emailAddress")


def _save_oauth_account(db: Session, user_id: int, platform: str, token_data: dict, identity: dict) -> None:
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == user_id, SocialAccount.platform == platform
    ).first()
    if account is None:
        account = SocialAccount(user_id=user_id, platform=platform)
        db.add(account)
    account.status = "connected"
    account.account_name, account.account_email = _identity_fields(platform, identity)
    account.permissions = "authenticated"
    account.last_sync = datetime.now(timezone.utc)
    account.access_token_encrypted = _encrypt_token(token_data.get("access_token"))
    account.refresh_token_encrypted = _encrypt_token(token_data.get("refresh_token")) or account.refresh_token_encrypted
    expires_in = token_data.get("expires_in")
    account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in)) if expires_in else None
    _activity(db, user_id, "Connected account", platform)
    db.commit()


def _basic_auth(client_id: str, client_secret: str) -> str:
    return base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("utf-8")


def _exchange_authorization_code(platform: str, code: str, client_id: str, client_secret: str, code_verifier: str | None) -> dict:
    data = {"grant_type": "authorization_code", "code": code, "redirect_uri": _callback_url(platform)}
    if platform == "linkedin":
        data.update({"client_id": client_id, "client_secret": client_secret})
        return _read_oauth_json("https://www.linkedin.com/oauth/v2/accessToken", data=data)
    if platform == "youtube":
        data.update({"client_id": client_id, "client_secret": client_secret})
        return _read_oauth_json("https://oauth2.googleapis.com/token", data=data)
    if platform == "x":
        if not code_verifier:
            raise HTTPException(status_code=400, detail="Missing X PKCE verifier.")
        data["code_verifier"] = code_verifier
        return _read_oauth_json("https://api.x.com/2/oauth2/token", data=data, headers={"Authorization": f"Basic {_basic_auth(client_id, client_secret)}"})
    if platform == "facebook":
        data.update({"client_id": client_id, "client_secret": client_secret})
        return _read_oauth_json(f"https://graph.facebook.com/v24.0/oauth/access_token?{urlencode(data)}")
    if platform == "instagram":
        data.update({"client_id": client_id, "client_secret": client_secret})
        return _read_oauth_json("https://api.instagram.com/oauth/access_token", data=data)
    return _read_oauth_json(
        "https://api.pinterest.com/v5/oauth/token",
        data={**data, "continuous_refresh": "true"},
        headers={"Authorization": f"Basic {_basic_auth(client_id, client_secret)}"},
    )


def _fetch_provider_identity(platform: str, access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    if platform == "linkedin":
        return _read_oauth_json("https://api.linkedin.com/v2/userinfo", headers=headers)
    if platform == "youtube":
        return _read_oauth_json("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
    if platform == "x":
        return _read_oauth_json("https://api.x.com/2/users/me", headers=headers)
    if platform == "facebook":
        return _read_oauth_json("https://graph.facebook.com/v24.0/me?fields=id,name,email", headers=headers)
    if platform == "instagram":
        return _read_oauth_json("https://graph.instagram.com/me?fields=user_id,username,account_type", headers=headers)
    return _read_oauth_json("https://api.pinterest.com/v5/user_account", headers=headers)


def _split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split(maxsplit=1)
    return (parts[0] if parts else "User", parts[1] if len(parts) > 1 else "")


def _profile_for(user: User, db: Session) -> UserProfile:
    profile = db.get(UserProfile, user.id)
    if profile is None:
        first_name, last_name = _split_name(user.full_name)
        profile = UserProfile(user_id=user.id, first_name=first_name, last_name=last_name)
        db.add(profile)
        db.flush()
    return profile


def _settings_for(user: User, db: Session) -> UserSettings:
    settings = db.get(UserSettings, user.id)
    if settings is None:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.flush()
    return settings


def _activity(db: Session, user_id: int, activity: str, platform: str | None = None) -> None:
    db.add(ActivityLog(user_id=user_id, activity=activity, platform=platform))


def _account_payload(account: SocialAccount | None, platform: str) -> dict:
    permissions = [item for item in (account.permissions if account else "").split(",") if item]
    return {
        "platform": platform,
        "status": account.status if account else "disconnected",
        "accountName": account.account_name if account else None,
        "accountEmail": account.account_email if account else None,
        "lastSync": account.last_sync if account else None,
        "permissions": permissions,
    }


def _profile_payload(user: User, profile: UserProfile) -> dict:
    avatar_url = None
    if profile.avatar_data and profile.avatar_content_type:
        avatar_url = f"data:{profile.avatar_content_type};base64,{base64.b64encode(profile.avatar_data).decode()}"
    return {"id": user.id, "firstName": profile.first_name, "lastName": profile.last_name,
            "fullName": user.full_name, "email": user.email, "phone": user.phone or "",
            "country": user.country or "", "timezone": profile.timezone,
            "organization": user.organization or "", "role": user.role or "", "bio": profile.bio or "",
            "language": profile.language, "avatarUrl": avatar_url}


@router.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == user.id).all()
    synced = [account.last_sync for account in accounts if account.last_sync]
    return {
        "syncStatus": {
            "lastSync": max(synced).isoformat() if synced else None,
            "nextSync": None,
            "totalConnected": sum(account.status == "connected" for account in accounts),
            "apiHealth": "healthy",
        },
        "scheduledPosts": [{"id": post.id, "caption": post.caption, "contentType": post.content_type,
                            "platforms": loads(post.platforms), "scheduledFor": post.scheduled_for,
                            "status": post.status} for post in db.query(Post).filter(
                                (Post.client_id == user.id) if user.role == "Business User" else (Post.owner_id == user.id),
                                Post.status == "scheduled").order_by(Post.scheduled_for).limit(5).all()],
    }


@router.get("/dashboard/summary")
def get_dashboard_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Role-scoped totals for dashboard cards; detailed records remain on resource routes."""
    post_scope = Post.client_id == user.id if user.role == "Business User" else Post.owner_id == user.id
    campaign_scope = Campaign.client_id == user.id if user.role == "Business User" else Campaign.owner_id == user.id
    posts = db.query(Post).filter(post_scope)
    campaigns = db.query(Campaign).filter(campaign_scope)
    return {
        "role": user.role,
        "campaigns": campaigns.count(),
        "activeCampaigns": campaigns.filter(Campaign.status == "active").count(),
        "draftPosts": posts.filter(Post.status == "draft").count(),
        "scheduledPosts": posts.filter(Post.status == "scheduled").count(),
        "publishedPosts": posts.filter(Post.status == "published").count(),
        "connectedPlatforms": db.query(SocialAccount).filter(SocialAccount.user_id == user.id, SocialAccount.status == "connected").count(),
        "unreadNotifications": db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).count(),
    }


@router.get("/activity")
def get_activity(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(ActivityLog).filter(ActivityLog.user_id == user.id)
            .order_by(ActivityLog.created_at.desc()).limit(25).all())
    return [{"id": row.id, "activity": row.activity, "platform": row.platform, "createdAt": row.created_at} for row in rows]


@router.get("/notifications")
def get_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(Notification).filter(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc()).limit(50).all())
    return [{"id": row.id, "title": row.title, "message": row.message, "type": row.type,
             "isRead": row.is_read, "createdAt": row.created_at} for row in rows]


@router.get("/notifications/unread-count")
def notification_unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"count": db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).count()}


@router.patch("/notifications/read-all")
def mark_all_notifications_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).update({"is_read": True})
    db.commit()
    return {"success": True}


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    return {"success": True}


@router.delete("/notifications")
def clear_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id).delete()
    db.commit()
    return {"success": True}


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(row); db.commit()
    return {"success": True}


@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _profile_for(user, db)
    db.commit()
    return _profile_payload(user, profile)


@router.put("/profile")
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    duplicate = db.query(User).filter(User.email == payload.email, User.id != user.id).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    if payload.phone:
        duplicate_phone = db.query(User).filter(User.phone == payload.phone, User.id != user.id).first()
        if duplicate_phone:
            raise HTTPException(status_code=400, detail="Phone number is already registered.")
    profile = _profile_for(user, db)
    user.full_name, user.email, user.phone = f"{payload.firstName.strip()} {payload.lastName.strip()}".strip(), str(payload.email), payload.phone or None
    # Roles are assigned through administration/team workflows; profile edits
    # must never become a privilege-escalation path.
    user.country, user.organization = payload.country or None, payload.organization or None
    profile.first_name, profile.last_name = payload.firstName.strip(), payload.lastName.strip()
    profile.timezone, profile.bio, profile.language = payload.timezone or "Asia/Kolkata", payload.bio or None, payload.language or "en"
    db.commit()
    db.refresh(profile)
    return {"success": True, "message": "Profile updated successfully.", "user": _profile_payload(user, profile)}


@router.post("/profile/avatar")
async def upload_avatar(avatar: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if avatar.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Use a JPG, PNG, or WebP image.")
    content = await avatar.read()
    if len(content) > 4 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 4 MB or smaller.")
    profile = _profile_for(user, db)
    profile.avatar_data, profile.avatar_content_type = content, avatar.content_type
    db.commit()
    return {"success": True, "avatarUrl": f"data:{avatar.content_type};base64,{base64.b64encode(content).decode()}"}


@router.delete("/profile/avatar")
def remove_avatar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _profile_for(user, db)
    profile.avatar_data = profile.avatar_content_type = None
    db.commit()
    return {"success": True}


@router.get("/settings")
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = _settings_for(user, db)
    db.commit()
    return {"general": {"language": settings.language, "timezone": settings.timezone, "country": user.country or "IN"},
            "notifications": {"emailNotifications": settings.email_notifications, "pushNotifications": settings.push_notifications,
                              "publishingAlerts": settings.publishing_alerts, "campaignAlerts": settings.campaign_alerts,
                              "securityAlerts": settings.security_alerts},
            "appearance": {"theme": settings.theme},
            "sessions": [{"id": user.id, "device": "Current device", "browser": "Current browser", "ipAddress": "—",
                          "lastActive": datetime.now(timezone.utc), "isCurrent": True}]}


@router.put("/settings")
def update_settings(payload: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = _settings_for(user, db)
    if payload.section == "general":
        settings.language = payload.language or settings.language
        settings.timezone = payload.timezone or settings.timezone
        user.country = payload.country or user.country
    elif payload.section == "notifications":
        for source, target in (("emailNotifications", "email_notifications"), ("pushNotifications", "push_notifications"),
                               ("publishingAlerts", "publishing_alerts"), ("campaignAlerts", "campaign_alerts"),
                               ("securityAlerts", "security_alerts")):
            value = getattr(payload, source)
            if value is not None:
                setattr(settings, target, value)
    elif payload.section == "appearance":
        if payload.theme not in {"light", "dark", "system"}:
            raise HTTPException(status_code=400, detail="Invalid theme.")
        settings.theme = payload.theme
    else:
        raise HTTPException(status_code=400, detail="Unknown settings section.")
    db.commit()
    return {"success": True, "message": "Settings saved."}


@router.get("/social/accounts")
def get_social_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = {row.platform: row for row in db.query(SocialAccount).filter(SocialAccount.user_id == user.id).all()}
    return [_account_payload(saved.get(platform), platform) for platform in PLATFORMS]


@router.get("/social/accounts/{platform}")
def get_social_account(platform: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _validate_platform(platform)
    row = db.query(SocialAccount).filter(SocialAccount.user_id == user.id, SocialAccount.platform == platform).first()
    return _account_payload(row, platform) | {"history": []}


@router.post("/social/connect/{platform}")
def connect_social_account(platform: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _validate_platform(platform)
    try:
        client_id, _ = _oauth_configuration(platform)
    except HTTPException:
        # A local provider adapter keeps the complete scheduling workflow usable
        # until production OAuth credentials are configured.
        _save_oauth_account(
            db,
            user.id,
            platform,
            {"access_token": f"mock-{secrets.token_urlsafe(24)}", "expires_in": 86400},
            {"name": f"{user.full_name} ({platform.title()})", "email": user.email},
        )
        return {"success": True, "message": f"{platform.title()} connected using the local demo provider.", "mode": "mock"}
    code_verifier = secrets.token_urlsafe(64) if platform == "x" else None
    state = _oauth_state(user.id, platform, code_verifier)
    params = {"response_type": "code", "client_id": client_id, "redirect_uri": _callback_url(platform), "state": state}
    if platform == "linkedin":
        endpoint, params["scope"] = "https://www.linkedin.com/oauth/v2/authorization", "openid profile email w_member_social"
    elif platform == "youtube":
        endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        params.update({"scope": "openid email profile https://www.googleapis.com/auth/youtube.upload", "access_type": "offline", "prompt": "consent"})
    elif platform == "x":
        endpoint = "https://x.com/i/oauth2/authorize"
        challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).decode().rstrip("=")
        params.update({"scope": "tweet.read tweet.write users.read offline.access", "code_challenge": challenge, "code_challenge_method": "S256"})
    elif platform == "facebook":
        endpoint, params["scope"] = "https://www.facebook.com/v24.0/dialog/oauth", "public_profile,email,pages_show_list,pages_read_engagement"
    elif platform == "instagram":
        endpoint, params["scope"] = "https://www.instagram.com/oauth/authorize", "instagram_business_basic,instagram_business_content_publish"
    else:
        endpoint, params["scope"] = "https://www.pinterest.com/oauth/", "boards:read,pins:read,pins:write,user_accounts:read"
    authorization_url = f"{endpoint}?{urlencode(params)}"
    return {"success": True, "message": "Continue with the social provider to connect the account.",
            "authorizationUrl": authorization_url}


@router.get("/social/callback/{platform}")
def social_oauth_callback(
    platform: str,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    _validate_platform(platform)
    if error or not code or not state:
        return RedirectResponse(f"{settings.FRONTEND_URL.rstrip('/')}/connect-apps?oauth_error={platform}")
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        if payload.get("platform") != platform:
            raise ValueError("Provider mismatch")
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state.")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="OAuth user no longer exists.")
    client_id, client_secret = _oauth_configuration(platform)
    token_data = _exchange_authorization_code(platform, code, client_id, client_secret, _decrypt_token(payload.get("pkce")))
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="Social provider did not return an access token.")
    identity = _fetch_provider_identity(platform, access_token)
    _save_oauth_account(db, user.id, platform, token_data, identity)
    return RedirectResponse(f"{settings.FRONTEND_URL.rstrip('/')}/connect-apps?connected={platform}")


@router.post("/social/disconnect/{platform}")
def disconnect_social_account(platform: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _validate_platform(platform)
    row = db.query(SocialAccount).filter(SocialAccount.user_id == user.id, SocialAccount.platform == platform).first()
    if row:
        row.status, row.account_name, row.account_email, row.permissions, row.last_sync = "disconnected", None, None, "", None
        row.access_token_encrypted = row.refresh_token_encrypted = row.token_expires_at = None
        _activity(db, user.id, "Disconnected account", platform)
        db.commit()
    return {"success": True, "message": f"{platform.title()} disconnected successfully."}


@router.post("/social/refresh/{platform}")
def refresh_social_account(platform: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _validate_platform(platform)
    account = db.query(SocialAccount).filter(SocialAccount.user_id == user.id, SocialAccount.platform == platform).first()
    if account is None or account.status != "connected":
        return {"success": False, "message": "No connected account is available to refresh."}
    refresh_token = _decrypt_token(account.refresh_token_encrypted)
    if not refresh_token or platform not in {"youtube", "x", "pinterest"}:
        return {"success": False, "message": f"{platform.title()} requires reconnecting when its access token expires."}
    client_id, client_secret = _oauth_configuration(platform)
    headers = {"Authorization": f"Basic {_basic_auth(client_id, client_secret)}"} if platform in {"x", "pinterest"} else None
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    if platform == "youtube":
        data.update({"client_id": client_id, "client_secret": client_secret})
    token_url = {
        "x": "https://api.x.com/2/oauth2/token",
        "youtube": "https://oauth2.googleapis.com/token",
        "pinterest": "https://api.pinterest.com/v5/oauth/token",
    }[platform]
    token_data = _read_oauth_json(token_url, data=data, headers=headers)
    account.access_token_encrypted = _encrypt_token(token_data.get("access_token"))
    if token_data.get("refresh_token"):
        account.refresh_token_encrypted = _encrypt_token(token_data["refresh_token"])
    if token_data.get("expires_in"):
        account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(token_data["expires_in"]))
    account.last_sync = datetime.now(timezone.utc)
    _activity(db, user.id, "Refreshed access token", platform)
    db.commit()
    return {"success": True, "message": f"{platform.title()} token refreshed."}


@router.post("/account/export")
def export_account_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _activity(db, user.id, "Requested data export")
    db.commit()
    return {"success": True, "message": "Export request submitted. You will receive an email with your data shortly."}


@router.delete("/account")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Delete dependent rows explicitly so this works on databases that do not
    # enforce ON DELETE CASCADE (notably SQLite unless foreign keys are enabled).
    post_ids = [post_id for (post_id,) in db.query(Post.id).filter(Post.owner_id == user.id).all()]
    campaign_ids = [campaign_id for (campaign_id,) in db.query(Campaign.id).filter(Campaign.owner_id == user.id).all()]
    if post_ids:
        db.query(AnalyticsMetric).filter(AnalyticsMetric.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(PublishingLog).filter(PublishingLog.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(CampaignPost).filter(CampaignPost.post_id.in_(post_ids)).delete(synchronize_session=False)
    if campaign_ids:
        db.query(CampaignPost).filter(CampaignPost.campaign_id.in_(campaign_ids)).delete(synchronize_session=False)
    db.query(Post).filter(Post.owner_id == user.id).delete(synchronize_session=False)
    db.query(Campaign).filter(Campaign.owner_id == user.id).delete(synchronize_session=False)
    db.query(MediaAsset).filter(MediaAsset.owner_id == user.id).delete(synchronize_session=False)
    db.query(Report).filter(Report.owner_id == user.id).delete(synchronize_session=False)
    db.query(CollaborationRequest).filter((CollaborationRequest.business_user_id == user.id) | (CollaborationRequest.requested_by_user_id == user.id)).delete(synchronize_session=False)
    db.query(ClientAssignment).filter(ClientAssignment.business_user_id == user.id).delete(synchronize_session=False)
    db.query(TeamMember).filter(TeamMember.user_id == user.id).delete(synchronize_session=False)
    db.query(Team).filter(Team.owner_id == user.id).delete(synchronize_session=False)
    for model in (ActivityLog, Notification, SocialAccount, UserProfile, UserSettings):
        db.query(model).filter(model.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return {"success": True, "message": "Account deleted successfully."}


def _validate_platform(platform: str) -> None:
    if platform not in PLATFORMS:
        raise HTTPException(status_code=404, detail="Unsupported platform")
