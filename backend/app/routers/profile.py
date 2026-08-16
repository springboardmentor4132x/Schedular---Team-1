from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import base64

from app.database import get_db
from app.models.user import User, UserProfile
from app.services.auth_service import get_current_user
from app.schemas.profile_schema import UserProfileUpdate, UserProfileResponse

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    avatar_url = None
    if profile and profile.avatar_data and profile.avatar_content_type:
        avatar_url = f"data:{profile.avatar_content_type};base64,{base64.b64encode(profile.avatar_data).decode()}"

    parts = user.full_name.split(" ", 1)
    first_name = profile.first_name if profile else (parts[0] if parts else "")
    last_name = profile.last_name if profile else (parts[1] if len(parts) > 1 else "")

    return UserProfileResponse(
        firstName=first_name,
        lastName=last_name,
        email=user.email,
        phone=user.phone or "",
        country=user.country or "",
        timezone=profile.timezone if profile else "Asia/Kolkata",
        organization=user.organization or "",
        role=user.role or "",
        bio=profile.bio if profile and profile.bio else "",
        language=profile.language if profile else "en",
        avatarUrl=avatar_url
    )


@router.put("")
def update_profile(
    payload: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update User base fields
    user.full_name = f"{payload.firstName} {payload.lastName}".strip()
    user.email = payload.email
    user.phone = payload.phone
    user.country = payload.country
    user.organization = payload.organization

    # Update or create UserProfile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    
    profile.first_name = payload.firstName
    profile.last_name = payload.lastName
    profile.timezone = payload.timezone or "Asia/Kolkata"
    profile.bio = payload.bio or ""
    profile.language = payload.language or "en"

    db.commit()
    return {"success": True, "message": "Profile updated successfully"}


@router.post("/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    
    data = await avatar.read()
    if len(data) > 4 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar exceeds 4MB limit.")
        
    profile.avatar_data = data
    profile.avatar_content_type = avatar.content_type
    db.commit()
    
    avatar_url = f"data:{profile.avatar_content_type};base64,{base64.b64encode(profile.avatar_data).decode()}"
    return {"success": True, "avatarUrl": avatar_url}


@router.delete("/avatar")
def delete_avatar(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile:
        profile.avatar_data = None
        profile.avatar_content_type = None
        db.commit()
    return {"success": True}
