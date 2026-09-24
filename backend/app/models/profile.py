import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    resume_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Extracted roles & skills stored as JSON lists
    target_roles: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    skills: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    experience_level: Mapped[str] = mapped_column(String(50), default="Entry Level", nullable=False)
    
    # User's job-hunt preferences
    preferred_locations: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    work_preferences: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)  # Remote, Hybrid, On-site

    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="candidate_profile")
    resume: Mapped[Optional["Resume"]] = relationship("Resume", back_populates="candidate_profile")
