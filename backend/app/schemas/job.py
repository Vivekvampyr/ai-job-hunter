from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class JobContactResponse(BaseModel):
    email: str = "Not Found"
    phone: str = "Not Found"
    application_form: Optional[str] = None
    contact_type: str = "Careers / Recruitment"

    model_config = ConfigDict(from_attributes=True)


class JobCompanyResponse(BaseModel):
    id: str
    name: str
    website: Optional[str] = None
    domain: Optional[str] = None
    ats_provider: Optional[str] = None
    ats_slug: Optional[str] = None
    logo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobMatchDetail(BaseModel):
    match_level: str = "Medium"  # High, Medium, Low
    match_score: int = 50       # 0 to 100
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    role_fit: str = "Medium"
    location_fit: str = "Partial"
    reasons: List[str] = Field(default_factory=list)


class JobResponse(BaseModel):
    id: str
    company_name: str
    company_website: Optional[str] = None
    company_logo: Optional[str] = None
    title: str
    location: str
    work_mode: str
    country: Optional[str] = None
    city: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    description: str
    apply_url: str
    source_ats: str
    contact: JobContactResponse
    match: Optional[JobMatchDetail] = None
    posted_at: Optional[datetime] = None
    fetched_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    jobs: List[JobResponse]


class JobSearchRequest(BaseModel):
    query: Optional[str] = None
    locations: Optional[List[str]] = None
    work_modes: Optional[List[str]] = None
    match_levels: Optional[List[str]] = None  # High, Medium, Low
    source_ats: Optional[List[str]] = None
    limit_per_source: int = Field(default=20, ge=1, le=100)


class JobFilterParams(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    match_level: Optional[str] = None
    company: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
