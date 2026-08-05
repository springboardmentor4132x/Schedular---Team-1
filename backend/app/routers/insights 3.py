"""Role-scoped analytics and report APIs backed by persisted records."""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import AnalyticsMetric, Post, Report
from app.models.user import ActivityLog, ClientAssignment, Notification, Team, User
from app.schemas.insights_schema import ReportCreate
from app.services.auth_service import get_current_user

router = APIRouter(tags=["Analytics & Reports"])


def _can_access_client(client_id: int | None, user: User, db: Session) -> bool:
    if user.role == "Content Creator":
        return client_id is None
    if user.role == "Business User":
        return client_id == user.id
    if user.role == "Administrator":
        return client_id is None or db.get(User, client_id) is not None
    return (
        client_id is not None
        and db.query(ClientAssignment)
        .join(Team, Team.id == ClientAssignment.team_id)
        .filter(
            Team.owner_id == user.id, ClientAssignment.business_user_id == client_id
        )
        .first()
        is not None
    )


def _post_scope(user: User):
    return (
        Post.client_id == user.id
        if user.role == "Business User"
        else Post.owner_id == user.id
    )


def _report_scope(user: User):
    return (
        Report.client_id == user.id
        if user.role == "Business User"
        else Report.owner_id == user.id
    )


def _report_payload(row: Report) -> dict:
    return {
        "id": row.id,
        "ownerId": row.owner_id,
        "clientId": row.client_id,
        "name": row.name,
        "status": row.status,
        "startDate": row.start_date,
        "endDate": row.end_date,
        "data": json.loads(row.rendered_data) if row.rendered_data else None,
        "createdAt": row.created_at,
    }


@router.get("/analytics")
def analytics_summary(
    client_id: int | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if client_id is not None and not _can_access_client(client_id, user, db):
        raise HTTPException(status_code=404, detail="Analytics not found.")
    posts = db.query(Post).filter(_post_scope(user))
    if client_id is not None:
        posts = posts.filter(Post.client_id == client_id)
    if start:
        posts = posts.filter(Post.created_at >= start)
    if end:
        posts = posts.filter(Post.created_at <= end)
    post_ids = [post_id for (post_id,) in posts.with_entities(Post.id).all()]
    if not post_ids:
        return {
            "source": "persisted",
            "totals": {
                "reach": 0,
                "impressions": 0,
                "reactions": 0,
                "comments": 0,
                "shares": 0,
            },
            "platforms": [],
        }
    totals = (
        db.query(
            func.coalesce(func.sum(AnalyticsMetric.reach), 0),
            func.coalesce(func.sum(AnalyticsMetric.impressions), 0),
            func.coalesce(func.sum(AnalyticsMetric.reactions), 0),
            func.coalesce(func.sum(AnalyticsMetric.comments), 0),
            func.coalesce(func.sum(AnalyticsMetric.shares), 0),
        )
        .filter(AnalyticsMetric.post_id.in_(post_ids))
        .one()
    )
    by_platform = (
        db.query(
            AnalyticsMetric.platform,
            func.sum(AnalyticsMetric.reach),
            func.sum(AnalyticsMetric.impressions),
            func.sum(AnalyticsMetric.reactions),
            func.sum(AnalyticsMetric.comments),
            func.sum(AnalyticsMetric.shares),
        )
        .filter(AnalyticsMetric.post_id.in_(post_ids))
        .group_by(AnalyticsMetric.platform)
        .all()
    )
    return {
        "source": "persisted",
        "totals": dict(
            zip(("reach", "impressions", "reactions", "comments", "shares"), totals)
        ),
        "platforms": [
            {
                "platform": platform,
                "reach": reach,
                "impressions": impressions,
                "reactions": reactions,
                "comments": comments,
                "shares": shares,
            }
            for platform, reach, impressions, reactions, comments, shares in by_platform
        ],
    }


@router.get("/reports")
def list_reports(
    client_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Report).filter(_report_scope(user))
    if client_id is not None:
        if not _can_access_client(client_id, user, db):
            raise HTTPException(status_code=404, detail="Reports not found.")
        query = query.filter(Report.client_id == client_id)
    return [
        _report_payload(row) for row in query.order_by(Report.created_at.desc()).all()
    ]


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"Marketing Team", "Content Creator", "Administrator"}:
        raise HTTPException(
            status_code=403,
            detail="Business Users can view reports but cannot generate them.",
        )
    if not _can_access_client(payload.client_id, user, db):
        raise HTTPException(
            status_code=403, detail="Choose an authorized client workspace."
        )
    # Generated data is an honest snapshot of current persisted metrics, not a fake download URL.
    snapshot = analytics_summary(
        payload.client_id, payload.start_date, payload.end_date, user, db
    )
    row = Report(
        owner_id=user.id,
        client_id=payload.client_id,
        name=payload.name,
        status="ready",
        start_date=payload.start_date,
        end_date=payload.end_date,
        rendered_data=json.dumps(snapshot),
    )
    db.add(row)
    db.flush()
    db.add(ActivityLog(user_id=user.id, activity="Generated report"))
    if payload.client_id:
        db.add(
            Notification(
                user_id=payload.client_id,
                title="Report ready",
                message=f"{payload.name} is ready to view.",
                type="report",
            )
        )
    db.commit()
    db.refresh(row)
    return _report_payload(row)


@router.get("/reports/{report_id}")
def get_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.get(Report, report_id)
    if row is None or (
        user.role != "Administrator"
        and row.owner_id != user.id
        and row.client_id != user.id
    ):
        raise HTTPException(status_code=404, detail="Report not found.")
    if user.role == "Marketing Team" and not _can_access_client(
        row.client_id, user, db
    ):
        raise HTTPException(status_code=404, detail="Report not found.")
    return _report_payload(row)
