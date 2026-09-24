from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CandidateProfileBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    target_roles: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    experience_level: str = "Entry Level"
    preferred_locations: List[str] = Field(default_factory=lambda: ["Indore", "Delhi", "Bangalore", "Remote"])
    work_preferences: List[str] = Field(default_factory=lambda: ["Remote", "Hybrid"])
    summary: Optional[str] = None


class CandidateProfileCreate(CandidateProfileBase):
    pass


class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    target_roles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    preferred_locations: Optional[List[str]] = None
    work_preferences: Optional[List[str]] = None
    summary: Optional[str] = None


class CandidateProfileResponse(CandidateProfileBase):
    id: str
    user_id: str
    resume_id: Optional[str] = None
    search_queries: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobSearchQueryList(BaseModel):
    queries: List[str]
