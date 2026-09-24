from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import extract_skills_from_text, detect_work_mode, extract_contact_info, matches_job_query


class SmartRecruitersClient(BaseATSClient):
    """Integrates with official SmartRecruiters public postings API.
    
    Endpoint: https://api.smartrecruiters.com/v1/companies/{company}/postings
    """
    BASE_URL = "https://api.smartrecruiters.com/v1/companies"

    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None, max_results: int = 8) -> List[NormalizedJob]:
        url = f"{self.BASE_URL}/{company_slug}/postings"
        jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return []
                data = response.json()
                postings = data.get("content", [])

                for item in postings:
                    if len(jobs) >= max_results:
                        break

                    title = item.get("name", "")
                    if not matches_job_query(title, "", query):
                        continue

                    loc = item.get("location", {})
                    city = loc.get("city", "")
                    country = loc.get("country", "")
                    is_remote = loc.get("remote", False)
                    location_name = f"{city}, {country}".strip(", ") or "Remote"
                    work_mode = "Remote" if is_remote else detect_work_mode(location_name, title)

                    skills = extract_skills_from_text(title)
                    company_name = company_slug.replace("-", " ").title()
                    apply_url = f"https://jobs.smartrecruiters.com/{company_slug}/{item.get('id')}"

                    jobs.append(NormalizedJob(
                        company_name=company_name,
                        company_website=f"https://{company_slug}.com",
                        company_ats_slug=company_slug,
                        external_id=f"sr_{item.get('id')}",
                        title=title,
                        location=location_name,
                        work_mode=work_mode,
                        required_skills=skills,
                        description=f"Position at {company_name} for {title} ({location_name})",
                        apply_url=apply_url,
                        source_ats="SmartRecruiters",
                        email_contact="Not Found",
                        phone_contact="Not Found",
                        application_form=apply_url
                    ))
        except Exception:
            return []

        return jobs
