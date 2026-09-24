from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.job import (
    JobResponse,
    JobListResponse,
    JobContactResponse,
    JobMatchDetail,
    JobSearchRequest
)
from app.integrations.ats.orchestrator import ATSOrchestrator
from app.repositories.job_repo import JobRepository
from app.repositories.profile_repo import ProfileRepository
from app.services.matching_engine import MatchingEngine

router = APIRouter()
ats_orchestrator = ATSOrchestrator()


def _format_job_response(job: Job, profile, db: Session) -> JobResponse:
    # Extract contact info
    email_val = "Not Found"
    phone_val = "Not Found"
    app_form = job.apply_url

    if job.contacts:
        contact = job.contacts[0]
        email_val = contact.email
        phone_val = contact.phone
        app_form = contact.application_form or job.apply_url

    # Calculate match
    match_detail = None
    if profile:
        match_detail = MatchingEngine.evaluate(
            candidate_roles=profile.target_roles or [],
            candidate_skills=profile.skills or [],
            candidate_experience=profile.experience_level or "Entry Level",
            preferred_locations=profile.preferred_locations or [],
            work_preferences=profile.work_preferences or [],
            job_title=job.title,
            job_location=job.location,
            job_work_mode=job.work_mode,
            job_required_skills=job.required_skills or [],
            job_description=job.description
        )

    return JobResponse(
        id=job.id,
        company_name=job.company.name if job.company else "Tech Company",
        company_website=job.company.website if job.company else None,
        company_logo=job.company.logo_url if job.company else None,
        title=job.title,
        location=job.location,
        work_mode=job.work_mode,
        country=job.country,
        city=job.city,
        required_skills=job.required_skills or [],
        description=job.description,
        apply_url=job.apply_url,
        source_ats=job.source_ats,
        contact=JobContactResponse(
            email=email_val,
            phone=phone_val,
            application_form=app_form,
            contact_type="Recruiter / Careers"
        ),
        match=match_detail,
        posted_at=job.posted_at,
        fetched_at=job.fetched_at
    )


@router.post("/search", response_model=JobListResponse)
async def search_jobs(
    search_req: JobSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    
    # 1. Fetch authorized public ATS jobs & verified feeds
    normalized_jobs = await ats_orchestrator.search_all(
        query=search_req.query,
        locations=search_req.locations or (profile.preferred_locations if profile else None),
        work_modes=search_req.work_modes or (profile.work_preferences if profile else None),
        limit_per_source=search_req.limit_per_source
    )

    # 2. Persist to database
    JobRepository.upsert_normalized_jobs(db, normalized_jobs)

    # 3. Retrieve jobs and calculate candidate matches
    jobs, total = JobRepository.get_jobs(db, query=search_req.query, limit=50)
    
    formatted_jobs = [_format_job_response(j, profile, db) for j in jobs]

    # Filter by match levels if requested
    if search_req.match_levels:
        allowed_levels = [l.lower() for l in search_req.match_levels]
        formatted_jobs = [j for j in formatted_jobs if j.match and j.match.match_level.lower() in allowed_levels]

    # Sort by match score descending
    formatted_jobs.sort(key=lambda x: x.match.match_score if x.match else 0, reverse=True)

    return JobListResponse(
        total=len(formatted_jobs),
        page=1,
        page_size=len(formatted_jobs),
        jobs=formatted_jobs
    )


@router.get("", response_model=JobListResponse)
def get_jobs(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    match_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    
    # If no jobs in DB yet, trigger initial seed load
    jobs, total = JobRepository.get_jobs(
        db, query=query, location=location, work_mode=work_mode,
        skip=(page - 1) * page_size, limit=page_size
    )

    if not jobs:
        # Prepopulate initial seeds
        seed_jobs = ats_orchestrator._get_verified_seed_jobs(query)
        JobRepository.upsert_normalized_jobs(db, seed_jobs)
        jobs, total = JobRepository.get_jobs(
            db, query=query, location=location, work_mode=work_mode,
            skip=(page - 1) * page_size, limit=page_size
        )

    formatted_jobs = [_format_job_response(j, profile, db) for j in jobs]

    if match_level and match_level.lower() != "all":
        formatted_jobs = [j for j in formatted_jobs if j.match and j.match.match_level.lower() == match_level.lower()]

    # Sort by match score descending
    formatted_jobs.sort(key=lambda x: x.match.match_score if x.match else 0, reverse=True)

    return JobListResponse(
        total=total,
        page=page,
        page_size=page_size,
        jobs=formatted_jobs
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = JobRepository.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    return _format_job_response(job, profile, db)
