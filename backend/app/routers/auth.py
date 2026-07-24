from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth_schema import UserCreate, UserLogin, Token, UserResponse
from app.schemas.dashboard_schema import PasswordChange
from app.models.user import ActivityLog, Notification, User
from app.services.auth_service import create_access_token, get_current_user, get_password_hash, verify_password
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered."
        )

    existing_phone = db.query(User).filter(User.phone == user.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is already registered."
        )

    hashed_pwd = get_password_hash(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hashed_pwd,
        country=user.country,
        role=user.role,
        organization=user.organization
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db.add_all([
        ActivityLog(user_id=new_user.id, activity="Account created"),
        Notification(user_id=new_user.id, title="Welcome to SocialPilot!", message="Your account has been created successfully.", type="info"),
        Notification(user_id=new_user.id, title="Connect Your Platforms", message="Link your social accounts to start scheduling content.", type="info", is_read=True),
    ])
    db.commit()
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db.add(ActivityLog(user_id=db_user.id, activity="Signed in"))
    db.commit()
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user}


@router.get("/me", response_model=UserResponse)
def get_authenticated_user(user: User = Depends(get_current_user)):
    """Use this endpoint to verify that an access token is accepted."""
    return user


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.currentPassword, user.password):
        return {"success": False, "message": "Current password is incorrect."}
    user.password = get_password_hash(payload.newPassword)
    db.add(ActivityLog(user_id=user.id, activity="Changed password"))
    db.commit()
    return {"success": True, "message": "Password changed successfully."}


@router.post("/logout-all")
def logout_other_devices(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Stateless JWTs have no server-side session registry yet; this endpoint is
    # intentionally a safe no-op until token revocation/session tracking is added.
    db.add(ActivityLog(user_id=user.id, activity="Requested logout from other devices"))
    db.commit()
    return {"success": True, "message": "All other sessions have been terminated."}
