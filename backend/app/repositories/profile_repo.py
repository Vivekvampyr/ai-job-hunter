from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.profile import CandidateProfile


class ProfileRepository:
    """Manages database persistence for CandidateProfile."""

    @staticmethod
    def get_by_user_id(db: Session, user_id: str) -> Optional[CandidateProfile]:
        return db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()

    @staticmethod
    def create_or_update(db: Session, user_id: str, profile_data: Dict[str, Any], resume_id: Optional[str] = None) -> CandidateProfile:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        
        if not profile:
            profile = CandidateProfile(
                user_id=user_id,
                resume_id=resume_id,
                full_name=profile_data.get("full_name", "Candidate"),
                email=profile_data.get("email"),
                phone=profile_data.get("phone"),
                target_roles=profile_data.get("target_roles", []),
                skills=profile_data.get("skills", []),
                experience_level=profile_data.get("experience_level", "Entry Level"),
                preferred_locations=profile_data.get("preferred_locations", ["Indore", "Delhi", "Bangalore", "Remote"]),
                work_preferences=profile_data.get("work_preferences", ["Remote", "Hybrid"]),
                summary=profile_data.get("summary")
            )
            db.add(profile)
        else:
            if resume_id:
                profile.resume_id = resume_id
            for key, val in profile_data.items():
                if hasattr(profile, key) and val is not None:
                    setattr(profile, key, val)

        db.commit()
        db.refresh(profile)
        return profile
