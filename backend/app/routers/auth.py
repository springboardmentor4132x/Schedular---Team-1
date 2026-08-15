from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth_schema import (
    RefreshRequest,
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
)
from app.schemas.dashboard_schema import PasswordChange
import base64
from app.models.user import (
    ActivityLog,
    Notification,
    RefreshToken,
    User,
    UserProfile,
    Team,
    TeamMember,
)
from app.services.auth_service import (
    ALGORITHM,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    token_hash,
    verify_password,
)
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # The first administrator bootstraps the installation. Subsequent public
    # registrations cannot grant themselves administrator privileges.
    if (
        user.role == "Administrator"
        and db.query(User).filter(User.role == "Administrator").first()
    ):
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts must be provisioned by an administrator.",
        )
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    existing_phone = db.query(User).filter(User.phone == user.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=400, detail="Phone number is already registered."
        )

    hashed_pwd = get_password_hash(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hashed_pwd,
        country=user.country,
        role=user.role,
        organization=user.organization,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if new_user.role == "Marketing Team":
        # Create a default team for this marketing user
        team_name = f"{new_user.full_name}'s Workspace"
        default_team = Team(name=team_name, owner_id=new_user.id)
        db.add(default_team)
        db.commit()
        db.refresh(default_team)
        # Add themselves as a member
        db.add(
            TeamMember(
                team_id=default_team.id, user_id=new_user.id, role="Marketing Team"
            )
        )

    db.add_all(
        [
            ActivityLog(user_id=new_user.id, activity="Account created"),
            Notification(
                user_id=new_user.id,
                title="Welcome to SocialPilot!",
                description="Your account has been created successfully.",
                type="info",
            ),
            Notification(
                user_id=new_user.id,
                title="Connect Your Platforms",
                description="Link your social accounts to start scheduling content.",
                type="info",
                is_read=True,
            ),
        ]
    )
    db.commit()

    return _token_response(new_user, db)


@router.post("/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Bootstrap default team if they are a Marketing Team user and have no teams
    if db_user.role == "Marketing Team":
        existing_team = db.query(Team).filter(Team.owner_id == db_user.id).first()
        if not existing_team:
            team_name = f"{db_user.full_name}'s Workspace"
            default_team = Team(name=team_name, owner_id=db_user.id)
            db.add(default_team)
            db.commit()
            db.refresh(default_team)
            db.add(
                TeamMember(
                    team_id=default_team.id, user_id=db_user.id, role="Marketing Team"
                )
            )
            db.commit()

    db.add(ActivityLog(user_id=db_user.id, activity="Signed in"))
    db.commit()
    return _token_response(db_user, db)


def _token_response(user: User, db: Session):
    claims = {"sub": user.email, "sv": user.session_version}
    access_token = create_access_token(data=claims)
    refresh_token = create_refresh_token(data=claims)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
    )
    db.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": _user_payload(user, db),
    }


def _user_payload(user: User, db: Session) -> dict:
    profile = db.get(UserProfile, user.id)
    avatar_url = None
    if profile and profile.avatar_data and profile.avatar_content_type:
        avatar_url = f"data:{profile.avatar_content_type};base64,{base64.b64encode(profile.avatar_data).decode()}"
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "country": user.country,
        "organization": user.organization,
        "avatarUrl": avatar_url,
    }


@router.post("/refresh", response_model=Token)
def refresh_access_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        claims = jwt.decode(
            payload.refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        email = claims.get("sub") if claims.get("type") == "refresh" else None
    except JWTError:
        email = None
    token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash(payload.refresh_token),
            RefreshToken.revoked_at.is_(None),
        )
        .first()
    )
    user = db.query(User).filter(User.email == email).first() if email else None
    if (
        not token
        or not user
        or claims.get("sv") != user.session_version
        or token.expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    token.revoked_at = datetime.now(timezone.utc)
    return _token_response(user, db)


@router.get("/me", response_model=UserResponse)
def get_authenticated_user(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Use this endpoint to verify that an access token is accepted."""
    return _user_payload(user, db)


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.currentPassword, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    user.password = get_password_hash(payload.newPassword)
    user.session_version += 1
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)
    ).update({"revoked_at": datetime.now(timezone.utc)})
    db.add(ActivityLog(user_id=user.id, activity="Changed password"))
    db.commit()
    return {"success": True, "message": "Password changed successfully."}


@router.post("/logout")
@router.post("/logout-all")
def logout_other_devices(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)
    ).update({"revoked_at": datetime.now(timezone.utc)})
    user.session_version += 1
    db.add(ActivityLog(user_id=user.id, activity="Signed out of all sessions"))
    db.commit()
    return {"success": True, "message": "All sessions have been terminated."}
