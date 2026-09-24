import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.application import (
    GenerateEmailRequest,
    EmailPreviewResponse,
    SendApplicationRequest,
    ApplicationResponse,
    ApplicationListResponse
)
from app.repositories.job_repo import JobRepository
from app.repositories.profile_repo import ProfileRepository
from app.repositories.application_repo import ApplicationRepository
from app.services.matching_engine import MatchingEngine
from app.services.ai_service import AIService
from app.integrations.gmail.client import GmailClient

router = APIRouter()

@router.post("/generate-email", response_model=EmailPreviewResponse)
async def generate_email(
    request: GenerateEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = JobRepository.get_job_by_id(db, request.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please create a profile or upload a resume first")

    # Match evaluation
    match = MatchingEngine.evaluate(
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

    # Determine recipient email
    recipient_email = "careers@" + (job.company.domain or "company.com")
    if job.contacts and job.contacts[0].email != "Not Found":
        recipient_email = job.contacts[0].email

    # Generate personalized pitch email
    email_draft = await AIService.generate_application_email(
        candidate_name=profile.full_name,
        candidate_skills=profile.skills or [],
        job_title=job.title,
        company_name=job.company.name if job.company else "the team",
        matched_skills=match.matched_skills,
        tone=request.tone
    )

    # Check resume attachment
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).first()
    resume_file_name = resume.file_name if resume else None

    return EmailPreviewResponse(
        job_id=job.id,
        company_name=job.company.name if job.company else "Company",
        job_title=job.title,
        recipient_email=recipient_email,
        subject=email_draft["subject"],
        body=email_draft["body"],
        resume_file_name=resume_file_name,
        resume_attached=bool(resume),
        match=match
    )


@router.post("/send", response_model=ApplicationResponse)
def send_application(
    request: SendApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = JobRepository.get_job_by_id(db, request.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    match = MatchingEngine.evaluate(
        candidate_roles=profile.target_roles or [] if profile else [],
        candidate_skills=profile.skills or [] if profile else [],
        candidate_experience=profile.experience_level or "Entry Level" if profile else "Entry Level",
        preferred_locations=profile.preferred_locations or [] if profile else [],
        work_preferences=profile.work_preferences or [] if profile else [],
        job_title=job.title,
        job_location=job.location,
        job_work_mode=job.work_mode,
        job_required_skills=job.required_skills or [],
        job_description=job.description
    )

    # Locate resume path if attachment is requested
    resume_path = None
    if request.attach_resume:
        resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).first()
        if resume and os.path.exists(resume.file_path):
            resume_path = resume.file_path

    # Send or create draft via Gmail Client
    gmail_res = GmailClient.send_email(
        access_token=current_user.gmail_access_token or "demo_token",
        refresh_token=current_user.gmail_refresh_token,
        to_email=request.recipient_email,
        subject=request.subject,
        body_text=request.body,
        attachment_path=resume_path,
        as_draft=request.save_as_draft
    )

    app_status = "Draft" if request.save_as_draft else "Sent"

    # Persist Application record
    app_record = ApplicationRepository.create_or_update(
        db=db,
        user_id=current_user.id,
        job_id=job.id,
        status=app_status,
        match_level=match.match_level,
        match_score=match.match_score,
        match_breakdown=match.model_dump(),
        email_subject=request.subject,
        email_body=request.body,
        recipient_email=request.recipient_email,
        gmail_message_id=gmail_res.get("id")
    )

    return ApplicationResponse(
        id=app_record.id,
        job_id=job.id,
        job_title=job.title,
        company_name=job.company.name if job.company else "Company",
        status=app_record.status,
        match_level=app_record.match_level,
        match_score=app_record.match_score,
        recipient_email=app_record.recipient_email,
        email_subject=app_record.email_subject,
        email_body=app_record.email_body,
        resume_attached=bool(resume_path),
        gmail_message_id=app_record.gmail_message_id,
        sent_at=app_record.sent_at,
        created_at=app_record.created_at
    )


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = ApplicationRepository.get_user_applications(db, current_user.id)
    results = []
    for a in apps:
        results.append(ApplicationResponse(
            id=a.id,
            job_id=a.job_id,
            job_title=a.job.title if a.job else "Position",
            company_name=a.job.company.name if a.job and a.job.company else "Company",
            status=a.status,
            match_level=a.match_level,
            match_score=a.match_score,
            recipient_email=a.recipient_email,
            email_subject=a.email_subject,
            email_body=a.email_body,
            resume_attached=a.resume_attached,
            gmail_message_id=a.gmail_message_id,
            sent_at=a.sent_at,
            created_at=a.created_at
        ))
    return ApplicationListResponse(total=len(results), applications=results)
