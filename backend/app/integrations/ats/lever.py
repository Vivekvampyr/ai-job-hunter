from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import extract_skills_from_text, detect_work_mode, extract_contact_info, matches_job_query


class LeverClient(BaseATSClient):
    """Integrates with official Lever public job postings API.
    
    Endpoint: https://api.lever.co/v0/postings/{company}?mode=json
    """
    BASE_URL = "https://api.lever.co/v0/postings"

    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None, max_results: int = 8) -> List[NormalizedJob]:
        url = f"{self.BASE_URL}/{company_slug}?mode=json"
        jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return []
                postings = response.json()
                if not isinstance(postings, list):
                    return []

                for item in postings:
                    if len(jobs) >= max_results:
                        break

                    title = item.get("text", "")
                    desc = item.get("descriptionPlain", "") or ""
                    additional = item.get("additionalPlain", "") or ""
                    full_desc = f"{desc}\n{additional}".strip()

                    if not matches_job_query(title, full_desc, query):
                        continue

                    categories = item.get("categories", {})
                    location_name = categories.get("location", "Remote")
                    desc = item.get("descriptionPlain", "") or ""
                    additional = item.get("additionalPlain", "") or ""
                    full_desc = f"{desc}\n{additional}".strip()

                    email_c, phone_c = extract_contact_info(full_desc)
                    work_mode = detect_work_mode(location_name, full_desc)
                    skills = extract_skills_from_text(f"{title} {full_desc}")

                    company_name = company_slug.replace("-", " ").title()

                    jobs.append(NormalizedJob(
                        company_name=company_name,
                        company_website=f"https://{company_slug}.com",
                        company_ats_slug=company_slug,
                        external_id=f"lever_{item.get('id')}",
                        title=title,
                        location=location_name,
                        work_mode=work_mode,
                        required_skills=skills,
                        description=full_desc[:2000],
                        apply_url=item.get("hostedUrl", f"https://jobs.lever.co/{company_slug}/{item.get('id')}"),
                        source_ats="Lever",
                        email_contact=email_c,
                        phone_contact=phone_c,
                        application_form=item.get("applyUrl") or item.get("hostedUrl")
                    ))
        except Exception:
            return []

        return jobs
