from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    resumes,
    profiles,
    jobs,
    applications,
    export,
    gmail
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Candidate Profiles"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs & Public ATS"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications & Outreach"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
api_router.include_router(gmail.router, prefix="/gmail", tags=["Gmail Integration"])
