from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class NormalizedJob(BaseModel):
    company_name: str
    company_website: Optional[str] = None
    company_ats_slug: Optional[str] = None
    external_id: str
    title: str
    location: str
    work_mode: str  # Remote, Hybrid, On-site
    country: Optional[str] = None
    city: Optional[str] = None
    required_skills: List[str] = []
    description: str = ""
    apply_url: str
    source_ats: str
    email_contact: str = "Not Found"
    phone_contact: str = "Not Found"
    application_form: Optional[str] = None


class BaseATSClient(ABC):
    """Abstract Base Class for public ATS integrations."""

    @abstractmethod
    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None) -> List[NormalizedJob]:
        pass
