from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import openpyxl

from app.database import get_db
from app.models.content import Report
from app.models.user import User, ActivityLog
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
def get_reports(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List reports for the current user."""
    reports = db.query(Report).filter(Report.owner_id == user.id).order_by(Report.id.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": r.id,
                "title": r.name,
                "type": "Campaign Performance",
                "period": f"{r.start_date.strftime('%Y-%m-%d')} to {r.end_date.strftime('%Y-%m-%d')}",
                "generatedAt": r.created_at.isoformat() if hasattr(r, 'created_at') else datetime.now(timezone.utc).isoformat(),
                "status": r.status,
            }
            for r in reports
        ]
    }
from typing import Optional
from app.models.analytics import PostAnalytics, CampaignAnalytics, AudienceAnalytics, PlatformAnalytics
from fastapi import Query

@router.post("")
def generate_report(
    name: str,
    start_date: datetime,
    end_date: datetime,
    report_type: str = Query("Engagement"),
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initiates a report generation."""
    report = Report(
        owner_id=user.id,
        name=name,
        start_date=start_date,
        end_date=end_date,
        status="processing",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    data = {"schema": "csv", "columns": [], "rows": []}
    
    if report_type == "Engagement":
        data["columns"] = ["Platform", "Reach", "Impressions", "Engagement"]
        pas = db.query(PlatformAnalytics).all()
        for pa in pas:
            if platform and pa.platform != platform: continue
            data["rows"].append([pa.platform, pa.reach, pa.impressions, pa.engagement])
            
    elif report_type == "Campaign":
        data["columns"] = ["Campaign ID", "Reach", "Impressions", "Engagement", "ROI"]
        cas = db.query(CampaignAnalytics).all()
        for ca in cas:
            data["rows"].append([ca.campaign_id, ca.reach, ca.impressions, ca.engagement, ca.roi])
            
    elif report_type == "Audience":
        data["columns"] = ["Platform", "Followers", "New Followers", "Lost Followers"]
        aas = db.query(AudienceAnalytics).all()
        for aa in aas:
            if platform and aa.platform != platform: continue
            data["rows"].append([aa.platform, aa.followers, aa.new_followers, aa.lost_followers])
            
    else:
        data["columns"] = ["Date", "Reach", "Impressions", "Clicks"]
        data["rows"].append([start_date.strftime("%Y-%m-%d"), 1245, 3500, 112])

    report.status = "ready"
    report.rendered_data = json.dumps(data)
    db.add(ActivityLog(user_id=user.id, activity=f"Generated {report_type} report"))
    db.commit()

    return {
        "id": report.id,
        "status": report.status,
        "message": "Report generation completed",
    }

@router.get("/{report_id}/preview")
def preview_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Preview a generated report's data."""
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.status != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")
        
    return {
        "success": True,
        "data": json.loads(report.rendered_data) if report.rendered_data else {}
    }

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a generated report."""
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(report)
    db.commit()
    return {"success": True, "message": "Report deleted"}


@router.get("/{report_id}/export/pdf")
def export_report_pdf(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exports a generated report as a PDF."""
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 720, f"SocialPilot Report: {report.name}")

    c.setFont("Helvetica", 12)
    c.drawString(72, 690, f"Generated for: {user.full_name}")
    c.drawString(
        72,
        670,
        f"Period: {report.start_date.strftime('%Y-%m-%d')} to {report.end_date.strftime('%Y-%m-%d')}",
    )

    # Parse the stored rendered_data which has our columns
    data = json.loads(report.rendered_data) if report.rendered_data else {}
    columns = data.get("columns", ["Date", "Reach", "Impressions", "Clicks"])
    rows = data.get("rows", [[report.start_date.strftime("%Y-%m-%d"), 1245, 3500, 112]])

    y = 630
    c.setFont("Helvetica-Bold", 12)
    x = 72
    for col in columns:
        c.drawString(x, y, str(col))
        x += 100

    c.setFont("Helvetica", 12)
    for row in rows:
        y -= 20
        if y < 50: # basic pagination
            c.showPage()
            y = 750
            c.setFont("Helvetica", 12)
        x = 72
        for cell in row:
            c.drawString(x, y, str(cell))
            x += 100

    c.save()
    pdf_content = buffer.getvalue()
    buffer.close()

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="report_{report_id}.pdf"'
        },
    )


@router.get("/{report_id}/export/excel")
def export_report_excel(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exports a generated report as an Excel file."""
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Summary"

    data = json.loads(report.rendered_data) if report.rendered_data else {}
    columns = data.get("columns", ["Date", "Reach", "Impressions", "Clicks"])
    rows = data.get("rows", [[report.start_date.strftime("%Y-%m-%d"), 1245, 3500, 112]])

    ws.append(columns)
    for row in rows:
        ws.append(row)

    buffer = io.BytesIO()
    wb.save(buffer)
    excel_content = buffer.getvalue()
    buffer.close()

    return Response(
        content=excel_content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="report_{report_id}.xlsx"'
        },
    )
