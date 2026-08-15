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
@router.post("")
def generate_report(
    name: str,
    start_date: datetime,
    end_date: datetime,
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

    # In a real system, we'd trigger a Celery task here to generate the PDF or Excel file
    # For now, we simulate quick generation
    report.status = "ready"
    report.rendered_data = json.dumps(
        {"schema": "csv", "columns": ["Date", "Reach", "Impressions", "Clicks"]}
    )
    db.add(ActivityLog(user_id=user.id, activity="Generated report"))
    db.commit()

    return {
        "id": report.id,
        "status": report.status,
        "message": "Report generation initiated",
    }


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

    y = 630
    c.setFont("Helvetica-Bold", 12)
    x = 72
    for col in columns:
        c.drawString(x, y, col)
        x += 100

    y -= 20
    c.setFont("Helvetica", 12)
    x = 72
    # Mock row data based on the start date
    c.drawString(x, y, report.start_date.strftime("%Y-%m-%d"))
    c.drawString(x + 100, y, "1,245")
    c.drawString(x + 200, y, "3,500")
    c.drawString(x + 300, y, "112")

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

    ws.append(columns)
    ws.append([report.start_date.strftime("%Y-%m-%d"), 1245, 3500, 112])

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
