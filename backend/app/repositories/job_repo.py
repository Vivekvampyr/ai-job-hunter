from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from app.models.company import Company
from app.models.job import Job
from app.models.contact import JobContact
from app.integrations.ats.base import NormalizedJob


class JobRepository:
    """Manages database persistence for companies, normalized jobs, and contacts."""

    @staticmethod
    def upsert_normalized_jobs(db: Session, normalized_jobs: List[NormalizedJob]) -> List[Job]:
        saved_jobs = []

        for item in normalized_jobs:
            # 1. Upsert Company
            company = db.query(Company).filter(Company.name == item.company_name).first()
            if not company:
                company = Company(
                    name=item.company_name,
                    website=item.company_website,
                    ats_provider=item.source_ats.lower(),
                    ats_slug=item.company_ats_slug
                )
                db.add(company)
                db.flush()

            # 2. Upsert Job
            job = db.query(Job).filter(Job.external_id == item.external_id).first()
            if not job:
                job = Job(
                    company_id=company.id,
                    external_id=item.external_id,
                    title=item.title,
                    location=item.location,
                    work_mode=item.work_mode,
                    country=item.country,
                    city=item.city,
                    required_skills=item.required_skills,
                    description=item.description,
                    apply_url=item.apply_url,
                    source_ats=item.source_ats
                )
                db.add(job)
                db.flush()

                # 3. Create Contact
                contact = JobContact(
                    company_id=company.id,
                    job_id=job.id,
                    email=item.email_contact,
                    phone=item.phone_contact,
                    application_form=item.application_form or item.apply_url
                )
                db.add(contact)
            else:
                # Update existing job fields if needed
                job.title = item.title
                job.location = item.location
                job.work_mode = item.work_mode
                job.required_skills = item.required_skills
                job.apply_url = item.apply_url

            saved_jobs.append(job)

        db.commit()
        return saved_jobs

    @staticmethod
    def get_jobs(
        db: Session,
        query: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        company: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Job], int]:
        q = db.query(Job).options(joinedload(Job.company), joinedload(Job.contacts))

        if query:
            search_filter = or_(
                Job.title.ilike(f"%{query}%"),
                Job.description.ilike(f"%{query}%")
            )
            q = q.filter(search_filter)

        if location:
            q = q.filter(Job.location.ilike(f"%{location}%"))

        if work_mode and work_mode.lower() != "all":
            q = q.filter(Job.work_mode.ilike(work_mode))

        if company:
            q = q.join(Job.company).filter(Company.name.ilike(f"%{company}%"))

        total = q.count()
        raw_jobs = q.order_by(desc(Job.fetched_at), Job.id.desc()).offset(skip).limit(limit * 3).all()

        # Interleave across companies and ATS sources so no single company/ATS dominates the page
        company_buckets = {}
        for j in raw_jobs:
            c_name = j.company.name if j.company else "Other"
            if c_name not in company_buckets:
                company_buckets[c_name] = []
            company_buckets[c_name].append(j)

        diversified_jobs: List[Job] = []
        while len(diversified_jobs) < limit and any(company_buckets.values()):
            for c_name in list(company_buckets.keys()):
                if company_buckets[c_name]:
                    diversified_jobs.append(company_buckets[c_name].pop(0))
                    if len(diversified_jobs) >= limit:
                        break

        return diversified_jobs, total

    @staticmethod
    def get_job_by_id(db: Session, job_id: str) -> Optional[Job]:
        return db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.contacts)
        ).filter(Job.id == job_id).first()
