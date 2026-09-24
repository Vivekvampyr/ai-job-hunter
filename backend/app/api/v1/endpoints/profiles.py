from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.profile import CandidateProfileResponse, CandidateProfileUpdate, JobSearchQueryList
from app.repositories.profile_repo import ProfileRepository
from app.services.ai_service import AIService

router = APIRouter()


@router.get("", response_model=CandidateProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    if not profile:
        # Create a clean, user-specific profile waiting for resume upload or custom entry
        default_data = {
            "full_name": current_user.full_name or "",
            "email": current_user.email,
            "target_roles": [],
            "skills": [],
            "experience_level": "Entry Level",
            "preferred_locations": ["Remote"],
            "work_preferences": ["Remote"],
            "summary": ""
        }
        profile = ProfileRepository.create_or_update(db, current_user.id, default_data)

    queries = AIService.generate_search_queries(
        target_roles=profile.target_roles or [],
        preferred_locations=profile.preferred_locations or [],
        skills=profile.skills or []
    )

    resp = CandidateProfileResponse.model_validate(profile)
    resp.search_queries = queries
    return resp


@router.put("", response_model=CandidateProfileResponse)
def update_profile(
    profile_in: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = profile_in.model_dump(exclude_unset=True)
    profile = ProfileRepository.create_or_update(db, current_user.id, update_data)

    queries = AIService.generate_search_queries(
        target_roles=profile.target_roles or [],
        preferred_locations=profile.preferred_locations or [],
        skills=profile.skills or []
    )

    resp = CandidateProfileResponse.model_validate(profile)
    resp.search_queries = queries
    return resp


@router.get("/queries", response_model=JobSearchQueryList)
def get_search_queries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = ProfileRepository.get_by_user_id(db, current_user.id)
    if not profile or (not profile.target_roles and not profile.skills):
        return JobSearchQueryList(queries=[
            "Software Engineer Remote",
            "Frontend Developer Remote",
            "Backend Engineer Remote",
            "Full Stack Developer Remote"
        ])

    queries = AIService.generate_search_queries(
        target_roles=profile.target_roles or [],
        preferred_locations=profile.preferred_locations or [],
        skills=profile.skills or []
    )
    return JobSearchQueryList(queries=queries)
