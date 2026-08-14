from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json

from app.database import get_db
from app.models.content import Report
from app.models.user import User, ActivityLog
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("")
def generate_report(
    name: str,
    start_date: datetime,
    end_date: datetime,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initiates a report generation."""
    report = Report(
        owner_id=user.id,
        name=name,
        start_date=start_date,
        end_date=end_date,
        status="processing"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # In a real system, we'd trigger a Celery task here to generate the PDF or Excel file
    # For now, we simulate quick generation
    report.status = "ready"
    report.rendered_data = json.dumps({"schema": "csv", "columns": ["Date", "Reach", "Impressions", "Clicks"]})
    db.add(ActivityLog(user_id=user.id, activity="Generated report"))
    db.commit()
    
    return {"id": report.id, "status": report.status, "message": "Report generation initiated"}

@router.get("/{report_id}/export/pdf")
def export_report_pdf(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports a generated report as a PDF."""
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.status != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")
        
    # Simulate PDF content
    # Generate a simple valid empty PDF structure
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Report: " + report.name.encode('utf-8') + b") Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000223 00000 n \n0000000311 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n406\n%%EOF\n"
    
    return Response(
        content=pdf_content, 
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report_{report_id}.pdf"'}
    )

@router.get("/{report_id}/export/excel")
def export_report_excel(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports a generated report as an Excel file."""
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.status != "ready":
        raise HTTPException(status_code=400, detail="Report is not ready yet")
        
    # Generate a simple CSV format string instead of invalid Excel bytes
    csv_content = f"Date,Reach,Impressions,Clicks\n{report.start_date.strftime('%Y-%m-%d')},0,0,0\n".encode('utf-8')
    
    return Response(
        content=csv_content, 
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="report_{report_id}.csv"'}
    )
