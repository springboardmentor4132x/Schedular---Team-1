"""Team and administrative user-management APIs for Module 1."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import (
    ActivityLog,
    ClientAssignment,
    CollaborationRequest,
    Notification,
    Team,
    TeamMember,
    User,
)
from app.schemas.team_schema import (
    CollaborationDecision,
    CollaborationRequestCreate,
    TeamCreate,
    TeamInvite,
)
from app.services.auth_service import get_current_user

router = APIRouter(tags=["Teams & Administration"])


def _team_payload(team: Team, db: Session) -> dict:
    members = (
        db.query(TeamMember, User)
        .join(User, User.id == TeamMember.user_id)
        .filter(TeamMember.team_id == team.id)
        .all()
    )
    return {
        "id": team.id,
        "name": team.name,
        "ownerId": team.owner_id,
        "createdAt": team.created_at,
        "members": [
            {
                "id": member.user_id,
                "name": user.full_name,
                "email": user.email,
                "role": member.role,
            }
            for member, user in members
        ],
    }


def _team_for_manager(team_id: int, user: User, db: Session) -> Team:
    team = db.get(Team, team_id)
    permitted = team and (team.owner_id == user.id or user.role == "Administrator")
    if not permitted:
        raise HTTPException(status_code=404, detail="Team not found.")
    return team


def _request_payload(row: CollaborationRequest, db: Session) -> dict:
    team = db.get(Team, row.team_id)
    business = db.get(User, row.business_user_id)
    return {
        "id": row.id,
        "teamId": row.team_id,
        "teamName": team.name if team else None,
        "businessUserId": row.business_user_id,
        "businessName": business.full_name if business else None,
        "requestedByUserId": row.requested_by_user_id,
        "message": row.message,
        "status": row.status,
        "createdAt": row.created_at,
        "resolvedAt": row.resolved_at,
    }


@router.get("/teams")
def list_teams(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "Business User":
        teams = (
            db.query(Team)
            .join(ClientAssignment, ClientAssignment.team_id == Team.id)
            .filter(ClientAssignment.business_user_id == user.id)
            .all()
        )
        return [_team_payload(team, db) for team in teams]
    query = db.query(Team)
    if user.role != "Administrator":
        query = query.filter(Team.owner_id == user.id)
    return [_team_payload(team, db) for team in query.order_by(Team.name).all()]


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"Administrator", "Marketing Team"}:
        raise HTTPException(
            status_code=403,
            detail="Only administrators and marketing teams can create teams.",
        )
    team = Team(name=payload.name.strip(), owner_id=user.id)
    db.add(team)
    db.flush()
    db.add(TeamMember(team_id=team.id, user_id=user.id, role=user.role))
    db.add(ActivityLog(user_id=user.id, activity="Created team"))
    db.commit()
    db.refresh(team)
    return _team_payload(team, db)


@router.post("/teams/{team_id}/members")
def invite_team_member(
    team_id: int,
    payload: TeamInvite,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = _team_for_manager(team_id, user, db)
    member = db.query(User).filter(User.email == payload.email.lower()).first()
    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Create an account for this email before adding it to the team.",
        )
    if (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == member.id)
        .first()
    ):
        raise HTTPException(status_code=409, detail="This user is already in the team.")
    db.add(TeamMember(team_id=team.id, user_id=member.id, role=payload.role))
    db.add(ActivityLog(user_id=user.id, activity=f"Added {member.full_name} to team"))
    db.commit()
    return _team_payload(team, db)


@router.delete("/teams/{team_id}/members/{member_id}", status_code=204)
def remove_team_member(
    team_id: int,
    member_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = _team_for_manager(team_id, user, db)
    if member_id == team.owner_id:
        raise HTTPException(status_code=422, detail="The team owner cannot be removed.")
    row = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == member_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Team member not found.")
    db.delete(row)
    db.commit()


@router.get("/clients/discover")
def discover_business_users(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.role != "Marketing Team":
        raise HTTPException(
            status_code=403, detail="Only Marketing Teams can discover Business Users."
        )
    team = db.query(Team).filter(Team.owner_id == user.id).first()
    if not team:
        return []
    
    # Get business users already assigned to this team
    assigned_user_ids = (
        db.query(ClientAssignment.business_user_id)
        .filter(ClientAssignment.team_id == team.id)
    )
    # Get business users
    businesses = (
        db.query(User)
        .filter(User.role == "Business User")
        .filter(User.id.not_in(assigned_user_ids))
        .order_by(User.full_name)
        .all()
    )
    return [
        {
            "id": b.id,
            "name": b.full_name,
            "email": b.email,
            "organization": b.organization,
        }
        for b in businesses
    ]


@router.get("/clients")
def list_client_workspaces(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.role == "Business User":
        return [
            {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "organization": user.organization,
            }
        ]
    if user.role not in {"Administrator", "Marketing Team"}:
        return []
    query = (
        db.query(User)
        .join(ClientAssignment, ClientAssignment.business_user_id == User.id)
        .join(Team, Team.id == ClientAssignment.team_id)
    )
    if user.role != "Administrator":
        query = query.filter(Team.owner_id == user.id)
    rows = query.distinct().order_by(User.organization, User.full_name).all()
    return [
        {
            "id": row.id,
            "name": row.full_name,
            "email": row.email,
            "organization": row.organization,
        }
        for row in rows
    ]


@router.post("/teams/{team_id}/clients/{business_user_id}", status_code=201)
def assign_client(
    team_id: int,
    business_user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = _team_for_manager(team_id, user, db)
    client = db.get(User, business_user_id)
    if client is None or client.role != "Business User":
        raise HTTPException(
            status_code=422, detail="Select a Business User as the client."
        )
    if (
        db.query(ClientAssignment)
        .filter_by(team_id=team.id, business_user_id=client.id)
        .first()
    ):
        raise HTTPException(
            status_code=409, detail="This client is already assigned to the team."
        )
    db.add(ClientAssignment(team_id=team.id, business_user_id=client.id))
    db.commit()
    return {"success": True}


@router.get("/marketing-teams/discover")
def discover_marketing_teams(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.role != "Business User":
        raise HTTPException(
            status_code=403, detail="Only Business Users can discover Marketing Teams."
        )
    assigned_team_ids = (
        db.query(ClientAssignment.team_id)
        .filter(ClientAssignment.business_user_id == user.id)
    )
    teams = (
        db.query(Team)
        .join(User, User.id == Team.owner_id)
        .filter(User.role == "Marketing Team")
        .filter(Team.id.not_in(assigned_team_ids))
        .order_by(Team.name)
        .all()
    )
    return [
        {"id": team.id, "name": team.name, "ownerId": team.owner_id} for team in teams
    ]


@router.post("/collaboration-requests", status_code=status.HTTP_201_CREATED)
def create_collaboration_request(
    payload: CollaborationRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "Business User":
        if payload.team_id is None:
            raise HTTPException(status_code=422, detail="team_id is required.")
        team = db.get(Team, payload.team_id)
        if team is None or db.get(User, team.owner_id).role != "Marketing Team":
            raise HTTPException(status_code=404, detail="Marketing Team not found.")
        if team.owner_id == user.id:
            raise HTTPException(status_code=400, detail="Cannot request collaboration with yourself.")
        business_user_id = user.id
        target_notify_user_id = team.owner_id
    elif user.role == "Marketing Team":
        if payload.business_user_id is None:
            raise HTTPException(status_code=422, detail="business_user_id is required.")
        if payload.business_user_id == user.id:
            raise HTTPException(status_code=400, detail="Cannot request collaboration with yourself.")
        team = db.query(Team).filter(Team.owner_id == user.id).first()
        if not team:
            raise HTTPException(status_code=404, detail="You do not have a team workspace.")
        business = db.query(User).filter(User.id == payload.business_user_id, User.role == "Business User").first()
        if not business:
            raise HTTPException(status_code=404, detail="Business User not found.")
        business_user_id = business.id
        target_notify_user_id = business.id
    else:
        raise HTTPException(
            status_code=403, detail="Role not authorized to request collaboration."
        )

    # Check duplicate pending request
    existing = (
        db.query(CollaborationRequest)
        .filter(
            CollaborationRequest.team_id == team.id,
            CollaborationRequest.business_user_id == business_user_id,
            CollaborationRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A collaboration request is already pending.",
        )

    # Check duplicate ClientAssignment
    existing_assignment = (
        db.query(ClientAssignment)
        .filter(
            ClientAssignment.team_id == team.id,
            ClientAssignment.business_user_id == business_user_id,
        )
        .first()
    )
    if existing_assignment:
        raise HTTPException(
            status_code=409,
            detail="Collaboration is already active.",
        )

    row = CollaborationRequest(
        team_id=team.id,
        business_user_id=business_user_id,
        requested_by_user_id=user.id,
        message=payload.message,
    )
    db.add(row)
    db.flush()
    db.add(
        Notification(
            user_id=target_notify_user_id,
            title="New collaboration request",
            message=f"{user.full_name} requested collaboration.",
            type="collaboration",
        )
    )
    db.add(
        ActivityLog(user_id=user.id, activity="Requested collaboration")
    )
    db.commit()
    db.refresh(row)
    return _request_payload(row, db)


@router.get("/collaboration-requests")
def list_collaboration_requests(
    status_filter: str | None = Query(None, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "Business User":
        query = db.query(CollaborationRequest).filter(
            CollaborationRequest.business_user_id == user.id
        )
    elif user.role == "Marketing Team":
        query = (
            db.query(CollaborationRequest)
            .join(Team, Team.id == CollaborationRequest.team_id)
            .filter(Team.owner_id == user.id)
        )
    elif user.role == "Administrator":
        query = db.query(CollaborationRequest)
    else:
        raise HTTPException(
            status_code=403, detail="Not permitted to view collaboration requests."
        )
    if status_filter:
        query = query.filter(CollaborationRequest.status == status_filter)
    return [
        _request_payload(row, db)
        for row in query.order_by(CollaborationRequest.created_at.desc()).all()
    ]


@router.patch("/collaboration-requests/{request_id}")
def decide_collaboration_request(
    request_id: int,
    payload: CollaborationDecision,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.get(CollaborationRequest, request_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Collaboration request not found.")
    
    team = db.get(Team, row.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    if row.requested_by_user_id == row.business_user_id:
        # Requested by Business User -> Marketing Team recipient decides (team owner)
        is_recipient = (team.owner_id == user.id)
    else:
        # Requested by Marketing Team -> Business User recipient decides
        is_recipient = (row.business_user_id == user.id)

    if not is_recipient and user.role != "Administrator":
        raise HTTPException(
            status_code=403,
            detail="Only the recipient of a collaboration request can resolve it.",
        )

    if row.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This collaboration request has already been resolved.",
        )

    row.status, row.resolved_at = payload.status, datetime.now(timezone.utc)
    if payload.status == "accepted":
        if (
            not db.query(ClientAssignment)
            .filter_by(team_id=team.id, business_user_id=row.business_user_id)
            .first()
        ):
            db.add(
                ClientAssignment(team_id=team.id, business_user_id=row.business_user_id)
            )
        
        if row.requested_by_user_id == row.business_user_id:
            message = f"{team.name} accepted your collaboration request."
        else:
            biz_user = db.get(User, row.business_user_id)
            message = f"{biz_user.full_name if biz_user else 'A client'} accepted your collaboration invitation."
    else:
        if row.requested_by_user_id == row.business_user_id:
            message = f"{team.name} declined your collaboration request."
        else:
            biz_user = db.get(User, row.business_user_id)
            message = f"{biz_user.full_name if biz_user else 'A client'} declined your collaboration invitation."

    db.add(
        Notification(
            user_id=row.requested_by_user_id,
            title="Collaboration request updated",
            message=message,
            type="collaboration",
        )
    )
    db.add(
        ActivityLog(
            user_id=user.id, activity=f"{payload.status.title()} collaboration request"
        )
    )
    db.commit()
    db.refresh(row)
    return _request_payload(row, db)


@router.post("/collaboration-requests/{request_id}/revoke")
def revoke_collaboration_request(
    request_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.get(CollaborationRequest, request_id)
    if row is None or row.status != "accepted":
        raise HTTPException(status_code=404, detail="Active collaboration not found.")
    team = db.get(Team, row.team_id)
    if team is None or (
        user.id not in {row.business_user_id, team.owner_id}
        and user.role != "Administrator"
    ):
        raise HTTPException(status_code=404, detail="Active collaboration not found.")
    row.status, row.resolved_at = "revoked", datetime.now(timezone.utc)
    db.query(ClientAssignment).filter(
        ClientAssignment.team_id == row.team_id,
        ClientAssignment.business_user_id == row.business_user_id,
    ).delete()
    counterpart = (
        team.owner_id if user.id == row.business_user_id else row.business_user_id
    )
    db.add(
        Notification(
            user_id=counterpart,
            title="Collaboration revoked",
            message="The client workspace is no longer accessible to this Marketing Team.",
            type="collaboration",
        )
    )
    db.add(ActivityLog(user_id=user.id, activity="Revoked collaboration"))
    db.commit()
    db.refresh(row)
    return _request_payload(row, db)


@router.get("/admin/users")
def admin_list_users(
    search: str | None = None,
    role: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "Administrator":
        raise HTTPException(status_code=403, detail="Administrator access required.")
    query = db.query(User)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    rows = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [
            {
                "id": row.id,
                "fullName": row.full_name,
                "email": row.email,
                "role": row.role,
                "organization": row.organization,
                "createdAt": row.created_at,
            }
            for row in rows
        ],
        "total": total,
    }
