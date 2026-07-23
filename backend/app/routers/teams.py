"""Team and administrative user-management APIs for Module 1."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import ActivityLog, ClientAssignment, Team, TeamMember, User
from app.schemas.team_schema import TeamCreate, TeamInvite
from app.services.auth_service import get_current_user

router = APIRouter(tags=["Teams & Administration"])


def _team_payload(team: Team, db: Session) -> dict:
    members = db.query(TeamMember, User).join(User, User.id == TeamMember.user_id).filter(TeamMember.team_id == team.id).all()
    return {"id": team.id, "name": team.name, "ownerId": team.owner_id, "createdAt": team.created_at,
            "members": [{"id": member.user_id, "name": user.full_name, "email": user.email, "role": member.role} for member, user in members]}


def _team_for_manager(team_id: int, user: User, db: Session) -> Team:
    team = db.get(Team, team_id)
    permitted = team and (team.owner_id == user.id or user.role == "Administrator")
    if not permitted:
        raise HTTPException(status_code=404, detail="Team not found.")
    return team


@router.get("/teams")
def list_teams(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Team)
    if user.role != "Administrator":
        query = query.filter(Team.owner_id == user.id)
    return [_team_payload(team, db) for team in query.order_by(Team.name).all()]


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"Administrator", "Marketing Team"}:
        raise HTTPException(status_code=403, detail="Only administrators and marketing teams can create teams.")
    team = Team(name=payload.name.strip(), owner_id=user.id)
    db.add(team); db.flush()
    db.add(TeamMember(team_id=team.id, user_id=user.id, role=user.role))
    db.add(ActivityLog(user_id=user.id, activity="Created team")); db.commit(); db.refresh(team)
    return _team_payload(team, db)


@router.post("/teams/{team_id}/members")
def invite_team_member(team_id: int, payload: TeamInvite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    team = _team_for_manager(team_id, user, db)
    member = db.query(User).filter(User.email == payload.email.lower()).first()
    if member is None:
        raise HTTPException(status_code=404, detail="Create an account for this email before adding it to the team.")
    if db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == member.id).first():
        raise HTTPException(status_code=409, detail="This user is already in the team.")
    db.add(TeamMember(team_id=team.id, user_id=member.id, role=payload.role))
    db.add(ActivityLog(user_id=user.id, activity=f"Added {member.full_name} to team")); db.commit()
    return _team_payload(team, db)


@router.delete("/teams/{team_id}/members/{member_id}", status_code=204)
def remove_team_member(team_id: int, member_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    team = _team_for_manager(team_id, user, db)
    if member_id == team.owner_id:
        raise HTTPException(status_code=422, detail="The team owner cannot be removed.")
    row = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == member_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Team member not found.")
    db.delete(row); db.commit()


@router.get("/clients")
def list_client_workspaces(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "Business User":
        return [{"id": user.id, "name": user.full_name, "email": user.email, "organization": user.organization}]
    if user.role not in {"Administrator", "Marketing Team"}:
        return []
    query = db.query(User).join(ClientAssignment, ClientAssignment.business_user_id == User.id).join(Team, Team.id == ClientAssignment.team_id)
    if user.role != "Administrator":
        query = query.filter(Team.owner_id == user.id)
    rows = query.distinct().order_by(User.organization, User.full_name).all()
    return [{"id": row.id, "name": row.full_name, "email": row.email, "organization": row.organization} for row in rows]


@router.post("/teams/{team_id}/clients/{business_user_id}", status_code=201)
def assign_client(team_id: int, business_user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    team = _team_for_manager(team_id, user, db)
    client = db.get(User, business_user_id)
    if client is None or client.role != "Business User":
        raise HTTPException(status_code=422, detail="Select a Business User as the client.")
    if db.query(ClientAssignment).filter_by(team_id=team.id, business_user_id=client.id).first():
        raise HTTPException(status_code=409, detail="This client is already assigned to the team.")
    db.add(ClientAssignment(team_id=team.id, business_user_id=client.id)); db.commit()
    return {"success": True}


@router.get("/admin/users")
def admin_list_users(search: str | None = None, role: str | None = None, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Administrator":
        raise HTTPException(status_code=403, detail="Administrator access required.")
    query = db.query(User)
    if search:
        query = query.filter((User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    rows = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": [{"id": row.id, "fullName": row.full_name, "email": row.email, "role": row.role, "organization": row.organization, "createdAt": row.created_at} for row in rows], "total": total}
