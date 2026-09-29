from typing import Optional, List
from pydantic import BaseModel
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


class ExportPayload(BaseModel):
    job_ids: Optional[List[str]] = None
    query: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    match_level: Optional[str] = None


def _build_excel_response(
    db: Session,
    current_user: User,
    job_ids: Optional[List[str]] = None,
    query: Optional[str] = None,
    location: Optional[str] = None,
    work_mode: Optional[str] = None,
    match_level: Optional[str] = None,
) -> Response:
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    
    jobs = []
    if job_ids and len(job_ids) > 0:
        jobs, _ = JobRepository.get_jobs(db, job_ids=job_ids)

    if not jobs:
        jobs, _ = JobRepository.get_jobs(db, query=query, location=location, work_mode=work_mode, limit=150)

    # Graceful fallback: If specific filters matched 0 jobs in DB, load top jobs so exported sheet is never empty
    if not jobs:
        jobs, _ = JobRepository.get_jobs(db, limit=100)

    # Format jobs for Excel
    export_rows = []
    for j in jobs:
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

        # Filter by match_level if specified (skip if job_ids were specifically selected)
        if not job_ids and match_level and match_level.lower() != "all" and match_lvl.lower() != match_level.lower():
            continue

        email_val = "Not Found"
        phone_val = "Not Found"
        app_form = j.apply_url

        if j.contacts:
            contact = j.contacts[0]
            email_val = contact.email or "Not Found"
            phone_val = contact.phone or "Not Found"
            app_form = contact.application_form or j.apply_url

        export_rows.append({
            "company_name": j.company.name if j.company else "Company",
            "title": j.title,
            "location": j.location or "Remote",
            "work_mode": j.work_mode or "Remote",
            "match_level": match_lvl,
            "match_score": match_sc,
            "email": email_val,
            "phone": phone_val,
            "application_form": app_form,
            "apply_url": j.apply_url
        })

    # If match_level was too strict and resulted in 0 rows, populate all loaded jobs
    if not export_rows and jobs:
        for j in jobs:
            email_val = j.contacts[0].email if (j.contacts and j.contacts[0].email) else "Not Found"
            phone_val = j.contacts[0].phone if (j.contacts and j.contacts[0].phone) else "Not Found"
            app_form = j.contacts[0].application_form if (j.contacts and j.contacts[0].application_form) else j.apply_url
            export_rows.append({
                "company_name": j.company.name if j.company else "Company",
                "title": j.title,
                "location": j.location or "Remote",
                "work_mode": j.work_mode or "Remote",
                "match_level": "Medium",
                "match_score": 50,
                "email": email_val,
                "phone": phone_val,
                "application_form": app_form,
                "apply_url": j.apply_url
            })

    # Sort rows by match score descending
    export_rows.sort(key=lambda x: x["match_score"], reverse=True)

    excel_bytes = ExcelExportService.generate_excel(export_rows)

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="AI_Job_Hunter_Matches.xlsx"; filename*=UTF-8\'\'AI_Job_Hunter_Matches.xlsx',
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
    )


@router.get("/excel")
def export_jobs_to_excel(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    match_level: Optional[str] = Query(None),
    job_ids: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _build_excel_response(
        db=db,
        current_user=current_user,
        job_ids=job_ids,
        query=query,
        location=location,
        work_mode=work_mode,
        match_level=match_level,
    )


@router.post("/excel")
def export_jobs_to_excel_post(
    payload: ExportPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _build_excel_response(
        db=db,
        current_user=current_user,
        job_ids=payload.job_ids,
        query=payload.query,
        location=payload.location,
        work_mode=payload.work_mode,
        match_level=payload.match_level,
    )
