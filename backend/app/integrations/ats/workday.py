from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import extract_skills_from_text, detect_work_mode, matches_job_query


class WorkdayClient(BaseATSClient):
    """Integrates with public Workday CXS JSON API (e.g. BrowserStack).
    
    Endpoint: https://{slug}.wd3.myworkdayjobs.com/wday/cxs/{slug}/External/jobs
    """

    WORKDAY_MAP = {
        "browserstack": {
            "name": "BrowserStack",
            "website": "https://browserstack.com",
            "api_url": "https://browserstack.wd3.myworkdayjobs.com/wday/cxs/browserstack/External/jobs",
            "base_apply": "https://browserstack.wd3.myworkdayjobs.com/en-US/External"
        }
    }

    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None, max_results: int = 20) -> List[NormalizedJob]:
        info = self.WORKDAY_MAP.get(company_slug.lower())
        if not info:
            return []

        jobs: List[NormalizedJob] = []
        payload = {
            "appliedFacets": {},
            "limit": max_results,
            "offset": 0,
            "searchText": query or ""
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(info["api_url"], json=payload)
                if res.status_code != 200:
                    return []

                data = res.json()
                items = data.get("jobPostings", [])

                for item in items:
                    title = item.get("title", "")
                    location_text = item.get("locationsText", "Bangalore / Remote")
                    ext_path = item.get("externalPath", "")
                    apply_url = f"{info['base_apply']}{ext_path}"

                    if not matches_job_query(title, f"{title} {location_text}", query):
                        continue

                    work_mode = detect_work_mode(location_text, title)
                    skills = extract_skills_from_text(f"{title} {location_text}")

                    bullet_id = item.get("bulletFields", [ext_path])
                    job_id = bullet_id[0] if bullet_id else ext_path

                    jobs.append(NormalizedJob(
                        company_name=info["name"],
                        company_website=info["website"],
                        company_ats_slug=company_slug,
                        external_id=f"wd_{company_slug}_{job_id}",
                        title=title,
                        location=location_text,
                        work_mode=work_mode,
                        required_skills=skills or ["Python", "CI/CD", "Testing", "Cloud"],
                        description=f"Join {info['name']} engineering team for the role of {title}. Location: {location_text}.",
                        apply_url=apply_url,
                        source_ats="Workday",
                        email_contact="careers@browserstack.com",
                        phone_contact="Not Found",
                        application_form=apply_url
                    ))
        except Exception:
            return []

        return jobs
