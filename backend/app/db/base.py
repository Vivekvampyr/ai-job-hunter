# Import all the models, so that Base has them before being
# imported by Alembic or the app
from app.core.database import Base
from app.models.user import User
from app.models.resume import Resume
from app.models.profile import CandidateProfile
from app.models.company import Company
from app.models.job import Job
from app.models.contact import JobContact
from app.models.application import Application

__all__ = [
    "Base",
    "User",
    "Resume",
    "CandidateProfile",
    "Company",
    "Job",
    "JobContact",
    "Application",
]
