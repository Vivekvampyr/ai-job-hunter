from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.job import JobResponse, JobMatchDetail


class GenerateEmailRequest(BaseModel):
    job_id: str
    tone: str = "confident and professional"  # professional, confident, enthusiastic
    custom_instructions: Optional[str] = None


class EmailPreviewResponse(BaseModel):
    job_id: str
    company_name: str
    job_title: str
    recipient_email: str
    subject: str
    body: str
    resume_file_name: Optional[str] = None
    resume_attached: bool = True
    match: JobMatchDetail


class SendApplicationRequest(BaseModel):
    job_id: str
    recipient_email: EmailStr
    subject: str = Field(..., min_length=3)
    body: str = Field(..., min_length=10)
    attach_resume: bool = True
    save_as_draft: bool = False  # If True, creates draft in Gmail instead of sending immediately


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    job_title: str
    company_name: str
    status: str
    match_level: str
    match_score: int
    recipient_email: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    resume_attached: bool
    gmail_message_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    total: int
    applications: List[ApplicationResponse]
