from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ResumeBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int


class ResumeResponse(ResumeBase):
    id: str
    user_id: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeUploadResponse(BaseModel):
    message: str
    resume: ResumeResponse
    profile_extracted: bool
    preview_text_snippet: Optional[str] = None


class ActiveResumeResponse(BaseModel):
    has_resume: bool
    resume: Optional[ResumeResponse] = None
    preview_text_snippet: Optional[str] = None
