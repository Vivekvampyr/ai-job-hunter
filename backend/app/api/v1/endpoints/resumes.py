import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeUploadResponse, ResumeResponse, ActiveResumeResponse
from app.services.resume_parser import ResumeParserService
from app.services.ai_service import AIService
from app.repositories.profile_repo import ProfileRepository

router = APIRouter()


@router.get("/current", response_model=ActiveResumeResponse)
def get_current_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Checks whether the user already uploaded a resume and returns active resume details."""
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )
    if not resume:
        return ActiveResumeResponse(
            has_resume=False,
            resume=None,
            preview_text_snippet=None
        )

    snippet = (resume.raw_text[:250] + "...") if len(resume.raw_text) > 250 else resume.raw_text
    return ActiveResumeResponse(
        has_resume=True,
        resume=ResumeResponse.model_validate(resume),
        preview_text_snippet=snippet
    )


@router.get("", response_model=List[ResumeResponse])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all resumes uploaded by the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )
    return [ResumeResponse.model_validate(r) for r in resumes]


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX resume formats are supported."
        )

    # Save to user uploads directory
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    saved_file_path = os.path.join(user_upload_dir, file.filename)

    with open(saved_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from resume
    try:
        raw_text, f_type, f_size = ResumeParserService.parse_file(saved_file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse resume content: {str(e)}"
        )

    # Record in database
    resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=saved_file_path,
        file_type=f_type,
        file_size=f_size,
        raw_text=raw_text
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Run AI profile extraction
    extracted_profile = await AIService.extract_candidate_profile(raw_text)

    # Update candidate profile in DB
    ProfileRepository.create_or_update(
        db=db,
        user_id=current_user.id,
        profile_data=extracted_profile,
        resume_id=resume.id
    )

    return ResumeUploadResponse(
        message="Resume uploaded and candidate profile extracted successfully!",
        resume=ResumeResponse.model_validate(resume),
        profile_extracted=True,
        preview_text_snippet=raw_text[:300] + ("..." if len(raw_text) > 300 else "")
    )
