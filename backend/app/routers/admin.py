"""Administrative APIs providing complete platform authority."""

from datetime import datetime, timezone
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Campaign, Post, PublishingLog, Report
from app.models.user import (
    ActivityLog,
    ClientAssignment,
    Notification,
    SocialAccount,
    Team,
    TeamMember,
    User,
    UserProfile,
    UserSettings,
)
from app.services.auth_service import get_password_hash, require_admin

router = APIRouter(prefix="/admin", tags=["Administration"])


# --- Schemas ---

class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    password: str = Field(min_length=8, max_length=128)
    role: str
    organization: Optional[str] = ""
    country: Optional[str] = "IN"


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    password: Optional[str] = None


class AdminAssignClient(BaseModel):
    business_user_id: int


# --- Endpoints ---

@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """System-wide summary KPIs for the administrative dashboard."""
    total_users = db.query(User).count()
    users_by_role = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )

    total_posts = db.query(Post).count()
    scheduled_posts = db.query(Post).filter(Post.status == "scheduled").count()
    published_posts = db.query(Post).filter(Post.status == "published").count()
    failed_posts = db.query(Post).filter(Post.status == "failed").count()
    queued_posts = db.query(Post).filter(Post.status == "queued").count()

    total_campaigns = db.query(Campaign).count()
    active_campaigns = db.query(Campaign).filter(Campaign.status == "active").count()
    total_teams = db.query(Team).count()
    connected_accounts = (
        db.query(SocialAccount).filter(SocialAccount.status == "connected").count()
    )

    return {
        "success": True,
        "data": {
            "totalUsers": total_users,
            "usersByRole": {
                "admin": users_by_role.get("Administrator", 0),
                "marketing": users_by_role.get("Marketing Team", 0),
                "creator": users_by_role.get("Content Creator", 0),
                "business": users_by_role.get("Business User", 0),
            },
            "posts": {
                "total": total_posts,
                "scheduled": scheduled_posts,
                "published": published_posts,
                "failed": failed_posts,
                "queued": queued_posts,
            },
            "campaigns": {
                "total": total_campaigns,
                "active": active_campaigns,
            },
            "totalTeams": total_teams,
            "connectedAccounts": connected_accounts,
            "systemHealth": "Operational",
        },
    }


@router.get("/users")
def get_admin_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all users across the platform with filtering and search."""
    query = db.query(User)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_pattern))
            | (User.email.ilike(search_pattern))
            | (User.organization.ilike(search_pattern))
        )

    if role:
        # Match normalized role or exact
        role_map = {
            "admin": "Administrator",
            "administrator": "Administrator",
            "marketing": "Marketing Team",
            "marketing_team": "Marketing Team",
            "creator": "Content Creator",
            "content_creator": "Content Creator",
            "business": "Business User",
            "business_user": "Business User",
        }
        resolved_role = role_map.get(role.lower(), role)
        query = query.filter(User.role == resolved_role)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "total": total,
        "items": [
            {
                "id": u.id,
                "fullName": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "organization": u.organization,
                "country": u.country,
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_admin_user(
    payload: AdminUserCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Directly create any user with a designated role."""
    # Check existing email
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    role_map = {
        "admin": "Administrator",
        "administrator": "Administrator",
        "marketing": "Marketing Team",
        "marketing_team": "Marketing Team",
        "creator": "Content Creator",
        "content_creator": "Content Creator",
        "business": "Business User",
        "business_user": "Business User",
        "Administrator": "Administrator",
        "Marketing Team": "Marketing Team",
        "Content Creator": "Content Creator",
        "Business User": "Business User",
    }
    resolved_role = role_map.get(payload.role, payload.role)

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone.strip() if payload.phone else None,
        password=get_password_hash(payload.password),
        role=resolved_role,
        organization=payload.organization.strip() if payload.organization else None,
        country=payload.country or "IN",
    )
    db.add(new_user)
    db.flush()

    # Initialise settings & profile
    names = payload.full_name.strip().split(" ", 1)
    first_name = names[0]
    last_name = names[1] if len(names) > 1 else ""

    profile = UserProfile(
        user_id=new_user.id,
        first_name=first_name,
        last_name=last_name,
    )
    settings = UserSettings(user_id=new_user.id)
    db.add(profile)
    db.add(settings)

    # Log admin action
    db.add(
        ActivityLog(
            user_id=admin.id,
            activity=f"Admin created user {new_user.full_name} ({resolved_role})",
        )
    )
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "User created successfully",
        "data": {
            "id": new_user.id,
            "fullName": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "organization": new_user.organization,
        },
    }


@router.get("/users/{user_id}")
def get_admin_user_details(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Retrieve detailed state for a specific user."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    post_count = db.query(Post).filter(Post.owner_id == target_user.id).count()
    campaign_count = (
        db.query(Campaign).filter(Campaign.owner_id == target_user.id).count()
    )
    connected_accounts = (
        db.query(SocialAccount).filter(SocialAccount.user_id == target_user.id).all()
    )

    return {
        "success": True,
        "data": {
            "id": target_user.id,
            "fullName": target_user.full_name,
            "email": target_user.email,
            "phone": target_user.phone,
            "role": target_user.role,
            "organization": target_user.organization,
            "country": target_user.country,
            "createdAt": target_user.created_at.isoformat()
            if target_user.created_at
            else None,
            "stats": {
                "posts": post_count,
                "campaigns": campaign_count,
                "connectedAccounts": len(connected_accounts),
            },
            "accounts": [
                {
                    "id": a.id,
                    "platform": a.platform,
                    "accountName": a.account_name,
                    "status": a.status,
                }
                for a in connected_accounts
            ],
        },
    }


@router.put("/users/{user_id}")
def update_admin_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update role, profile, or credentials of any user."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.full_name is not None:
        target_user.full_name = payload.full_name.strip()
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email.lower(), User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already taken by another user.")
        target_user.email = payload.email.lower().strip()
    if payload.phone is not None:
        target_user.phone = payload.phone.strip()
    if payload.organization is not None:
        target_user.organization = payload.organization.strip()
    if payload.country is not None:
        target_user.country = payload.country.strip()
    if payload.role is not None:
        role_map = {
            "admin": "Administrator",
            "administrator": "Administrator",
            "marketing": "Marketing Team",
            "marketing_team": "Marketing Team",
            "creator": "Content Creator",
            "content_creator": "Content Creator",
            "business": "Business User",
            "business_user": "Business User",
            "Administrator": "Administrator",
            "Marketing Team": "Marketing Team",
            "Content Creator": "Content Creator",
            "Business User": "Business User",
        }
        target_user.role = role_map.get(payload.role, payload.role)
    if payload.password:
        target_user.password = get_password_hash(payload.password)
        target_user.session_version += 1

    db.add(
        ActivityLog(
            user_id=admin.id,
            activity=f"Admin modified user {target_user.full_name} (ID: {target_user.id})",
        )
    )
    db.commit()

    return {
        "success": True,
        "message": "User updated successfully",
        "data": {
            "id": target_user.id,
            "fullName": target_user.full_name,
            "email": target_user.email,
            "role": target_user.role,
            "organization": target_user.organization,
        },
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_admin_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user account and associated resources."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own account.",
        )

    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    user_name = target_user.full_name
    db.delete(target_user)
    db.add(
        ActivityLog(
            user_id=admin.id,
            activity=f"Admin deleted user {user_name} (ID: {user_id})",
        )
    )
    db.commit()

    return {"success": True, "message": f"User {user_name} deleted successfully"}


@router.get("/teams")
def get_admin_teams(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all teams with full owner, member, and client assignment details."""
    teams = db.query(Team).all()

    result = []
    for team in teams:
        owner = db.get(User, team.owner_id)
        members = (
            db.query(TeamMember, User)
            .join(User, User.id == TeamMember.user_id)
            .filter(TeamMember.team_id == team.id)
            .all()
        )
        clients = (
            db.query(ClientAssignment, User)
            .join(User, User.id == ClientAssignment.business_user_id)
            .filter(ClientAssignment.team_id == team.id)
            .all()
        )
        result.append(
            {
                "id": team.id,
                "name": team.name,
                "owner": {
                    "id": owner.id if owner else None,
                    "name": owner.full_name if owner else "Unknown",
                    "email": owner.email if owner else "",
                },
                "memberCount": len(members),
                "members": [
                    {
                        "id": u.id,
                        "name": u.full_name,
                        "email": u.email,
                        "role": m.role,
                    }
                    for m, u in members
                ],
                "assignedClients": [
                    {
                        "id": u.id,
                        "name": u.full_name,
                        "email": u.email,
                        "organization": u.organization,
                    }
                    for c, u in clients
                ],
                "createdAt": team.created_at.isoformat() if team.created_at else None,
            }
        )

    return {"success": True, "items": result}


@router.delete("/teams/{team_id}")
def delete_admin_team(
    team_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin direct deletion of a team workspace."""
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    team_name = team.name
    db.delete(team)
    db.add(
        ActivityLog(
            user_id=admin.id,
            activity=f"Admin deleted team {team_name} (ID: {team_id})",
        )
    )
    db.commit()

    return {"success": True, "message": f"Team {team_name} deleted successfully"}


@router.post("/teams/{team_id}/assign-client")
def admin_assign_client(
    team_id: int,
    payload: AdminAssignClient,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin direct assignment of a business user to a marketing team workspace."""
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    client = db.get(User, payload.business_user_id)
    if not client or client.role != "Business User":
        raise HTTPException(
            status_code=400, detail="Target user must be a registered Business User."
        )

    existing = (
        db.query(ClientAssignment)
        .filter_by(team_id=team.id, business_user_id=client.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="This client is already assigned to this team."
        )

    db.add(ClientAssignment(team_id=team.id, business_user_id=client.id))
    db.add(
        Notification(
            user_id=client.id,
            title="Assigned to Marketing Team",
            description=f"An administrator assigned your workspace to {team.name}.",
            type="team",
        )
    )
    db.add(
        Notification(
            user_id=team.owner_id,
            title="New Client Assigned",
            description=f"An administrator assigned {client.full_name} to your workspace.",
            type="team",
        )
    )
    db.add(
        ActivityLog(
            user_id=admin.id,
            activity=f"Admin assigned client {client.full_name} to team {team.name}",
        )
    )
    db.commit()

    return {"success": True, "message": "Client assigned to team successfully"}


@router.get("/logs")
def get_admin_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """System-wide audit trail of activities and publishing actions."""
    logs = (
        db.query(ActivityLog, User)
        .join(User, User.id == ActivityLog.user_id)
        .order_by(ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    publishing_logs = (
        db.query(PublishingLog, Post)
        .join(Post, Post.id == PublishingLog.post_id)
        .order_by(PublishingLog.attempted_at.desc())
        .limit(20)
        .all()
    )

    return {
        "success": True,
        "activities": [
            {
                "id": log.id,
                "userId": user.id,
                "userName": user.full_name,
                "userRole": user.role,
                "activity": log.activity,
                "platform": log.platform,
                "createdAt": log.created_at.isoformat() if log.created_at else None,
            }
            for log, user in logs
        ],
        "publishingEvents": [
            {
                "id": pl.id,
                "postId": pl.post_id,
                "platform": pl.platform,
                "status": pl.status,
                "errorMessage": pl.error_message,
                "attemptedAt": pl.attempted_at.isoformat() if pl.attempted_at else None,
                "caption": post.caption[:60] if post else "",
            }
            for pl, post in publishing_logs
        ],
    }


@router.get("/platform-health")
def get_platform_health(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Aggregated connectivity status and health across social providers."""
    platforms = ["facebook", "instagram", "linkedin", "youtube", "x", "pinterest"]
    health = []

    for plat in platforms:
        connected = (
            db.query(SocialAccount)
            .filter(SocialAccount.platform == plat, SocialAccount.status == "connected")
            .count()
        )
        total = db.query(SocialAccount).filter(SocialAccount.platform == plat).count()
        failed_publications = (
            db.query(PublishingLog)
            .filter(PublishingLog.platform == plat, PublishingLog.status == "failed")
            .count()
        )

        health.append(
            {
                "platform": plat,
                "activeAccounts": connected,
                "totalAccounts": total,
                "failedAttempts": failed_publications,
                "status": "Operational" if failed_publications < 5 else "Degraded",
            }
        )

    return {"success": True, "platforms": health}
