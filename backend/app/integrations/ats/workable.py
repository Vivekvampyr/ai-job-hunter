from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import extract_skills_from_text, detect_work_mode, extract_contact_info


class WorkableClient(BaseATSClient):
    """Integrates with official Workable public job board widget API.
    
    Endpoint: https://apply.workable.com/api/v1/widget/accounts/{company_slug}
    """
    BASE_URL = "https://apply.workable.com/api/v1/widget/accounts"

    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None) -> List[NormalizedJob]:
        url = f"{self.BASE_URL}/{company_slug}"
        jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers={"Accept": "application/json"})
                if response.status_code != 200:
                    return []
                data = response.json()
                raw_jobs = data.get("jobs", [])

                for item in raw_jobs:
                    title = item.get("title", "")
                    if query and query.lower() not in title.lower():
                        continue

                    city = item.get("city", "")
                    country = item.get("country", "")
                    is_telecommute = item.get("telecommuting", False)
                    location_name = f"{city}, {country}".strip(", ") or "Remote"
                    work_mode = "Remote" if is_telecommute else detect_work_mode(location_name, title)

                    skills = extract_skills_from_text(title)
                    company_name = company_slug.replace("-", " ").title()
                    shortcode = item.get("shortcode", item.get("id", ""))
                    apply_url = item.get("url") or f"https://apply.workable.com/{company_slug}/j/{shortcode}/"

                    jobs.append(NormalizedJob(
                        company_name=company_name,
                        company_website=f"https://{company_slug}.com",
                        company_ats_slug=company_slug,
                        external_id=f"workable_{shortcode}",
                        title=title,
                        location=location_name,
                        work_mode=work_mode,
                        required_skills=skills,
                        description=f"Open role for {title} at {company_name} ({location_name}).",
                        apply_url=apply_url,
                        source_ats="Workable",
                        email_contact="Not Found",
                        phone_contact="Not Found",
                        application_form=apply_url
                    ))
        except Exception:
            return []

        return jobs
