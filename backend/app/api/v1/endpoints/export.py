from typing import Optional
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.repositories.job_repo import JobRepository
from app.repositories.profile_repo import ProfileRepository
from app.services.matching_engine import MatchingEngine
from app.services.excel_service import ExcelExportService

router = APIRouter()


@router.get("/excel")
def export_jobs_to_excel(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    match_level: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    jobs, _ = JobRepository.get_jobs(db, query=query, location=location, work_mode=work_mode, limit=100)

    # Format jobs for Excel
    export_rows = []
    for j in jobs:
        # Match calculation
        match_detail = None
        if profile:
            match_detail = MatchingEngine.evaluate(
                candidate_roles=profile.target_roles or [],
                candidate_skills=profile.skills or [],
                candidate_experience=profile.experience_level or "Entry Level",
                preferred_locations=profile.preferred_locations or [],
                work_preferences=profile.work_preferences or [],
                job_title=j.title,
                job_location=j.location,
                job_work_mode=j.work_mode,
                job_required_skills=j.required_skills or [],
                job_description=j.description
            )

        match_lvl = match_detail.match_level if match_detail else "Medium"
        match_sc = match_detail.match_score if match_detail else 50

        # Filter by match_level if specified
        if match_level and match_level.lower() != "all" and match_lvl.lower() != match_level.lower():
            continue

        email_val = "Not Found"
        phone_val = "Not Found"
        app_form = j.apply_url

        if j.contacts:
            contact = j.contacts[0]
            email_val = contact.email
            phone_val = contact.phone
            app_form = contact.application_form or j.apply_url

        export_rows.append({
            "company_name": j.company.name if j.company else "Company",
            "title": j.title,
            "location": j.location,
            "work_mode": j.work_mode,
            "match_level": match_lvl,
            "match_score": match_sc,
            "email": email_val,
            "phone": phone_val,
            "application_form": app_form,
            "apply_url": j.apply_url
        })

    # Sort rows by match score
    export_rows.sort(key=lambda x: x["match_score"], reverse=True)

    excel_bytes = ExcelExportService.generate_excel(export_rows)

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=AI_Job_Hunter_Matches.xlsx"
        }
    )
