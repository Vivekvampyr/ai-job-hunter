from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import clean_html, extract_skills_from_text, detect_work_mode, extract_contact_info, matches_job_query


class PublicTechFeedsClient(BaseATSClient):
    """Integrates with legitimate, open public job feeds (such as Arbeitnow & RemoteOK)
    
    which index verified public ATS postings with zero scraping.
    """
    ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"

    async def fetch_jobs(self, company_slug: str = "", query: Optional[str] = None, max_results: int = 25) -> List[NormalizedJob]:
        jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.ARBEITNOW_URL)
                if response.status_code != 200:
                    return []
                data = response.json()
                items = data.get("data", [])

                for item in items:
                    if len(jobs) >= max_results:
                        break

                    title = item.get("title", "")
                    raw_desc = item.get("description", "")
                    clean_desc = clean_html(raw_desc)
                    location = item.get("location", "Remote")
                    tags = item.get("tags", [])
                    company = item.get("company_name", "Tech Startup")
                    slug = item.get("slug", "")

                    if not matches_job_query(f"{title} {' '.join(tags)}", clean_desc, query):
                        continue

                    email_c, phone_c = extract_contact_info(clean_desc)
                    work_mode = "Remote" if item.get("remote", False) else detect_work_mode(location, clean_desc)
                    skills = list(set(extract_skills_from_text(f"{title} {clean_desc}") + [t.title() for t in tags[:5]]))

                    jobs.append(NormalizedJob(
                        company_name=company,
                        company_website=f"https://www.google.com/search?q={company}",
                        company_ats_slug=slug,
                        external_id=f"feed_{slug}",
                        title=title,
                        location=location,
                        work_mode=work_mode,
                        required_skills=skills,
                        description=clean_desc[:2000],
                        apply_url=item.get("url", f"https://www.arbeitnow.com/jobs/{slug}"),
                        source_ats="Public Feed",
                        email_contact=email_c,
                        phone_contact=phone_c,
                        application_form=item.get("url")
                    ))
        except Exception:
            return []

        return jobs
