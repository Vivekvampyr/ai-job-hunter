from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import clean_html, extract_skills_from_text, detect_work_mode, extract_contact_info, matches_job_query


class GreenhouseClient(BaseATSClient):
    """Integrates with official Greenhouse public job board API.
    
    Endpoint: https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true
    """
    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None, max_results: int = 8) -> List[NormalizedJob]:
        url = f"{self.BASE_URL}/{company_slug}/jobs?content=true"
        jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return []
                data = response.json()
                raw_jobs = data.get("jobs", [])

                for item in raw_jobs:
                    if len(jobs) >= max_results:
                        break

                    title = item.get("title", "")
                    raw_content = item.get("content", "")
                    clean_content = clean_html(raw_content)

                    if not matches_job_query(title, clean_content, query):
                        continue

                    location_info = item.get("location", {})
                    location_name = location_info.get("name", "Remote") if isinstance(location_info, dict) else str(location_info)
                    raw_content = item.get("content", "")
                    clean_content = clean_html(raw_content)
                    
                    email_c, phone_c = extract_contact_info(clean_content)
                    work_mode = detect_work_mode(location_name, clean_content)
                    skills = extract_skills_from_text(f"{title} {clean_content}")

                    NAME_MAP = {
                        "razorpaysoftwareprivatelimited": ("Razorpay", "https://razorpay.com"),
                        "togetherai": ("Together AI", "https://together.ai"),
                        "inmobi": ("InMobi", "https://inmobi.com"),
                        "monzo": ("Monzo", "https://monzo.com"),
                        "brex": ("Brex", "https://brex.com"),
                        "vercel": ("Vercel", "https://vercel.com"),
                        "stripe": ("Stripe", "https://stripe.com"),
                        "github": ("GitHub", "https://github.com"),
                        "gitlab": ("GitLab", "https://gitlab.com"),
                        "cloudflare": ("Cloudflare", "https://cloudflare.com"),
                        "mongodb": ("MongoDB", "https://mongodb.com"),
                        "elastic": ("Elastic", "https://elastic.co"),
                        "figma": ("Figma", "https://figma.com"),
                        "canonical": ("Canonical", "https://canonical.com"),
                    }
                    if company_slug.lower() in NAME_MAP:
                        company_name, company_web = NAME_MAP[company_slug.lower()]
                    else:
                        company_name = company_slug.replace("-", " ").title()
                        company_web = f"https://{company_slug}.com"

                    jobs.append(NormalizedJob(
                        company_name=company_name,
                        company_website=company_web,
                        company_ats_slug=company_slug,
                        external_id=f"gh_{item.get('id')}",
                        title=title,
                        location=location_name,
                        work_mode=work_mode,
                        required_skills=skills,
                        description=clean_content[:2000],  # Store clean snippet/text
                        apply_url=item.get("absolute_url", f"https://boards.greenhouse.io/{company_slug}/jobs/{item.get('id')}"),
                        source_ats="Greenhouse",
                        email_contact=email_c,
                        phone_contact=phone_c,
                        application_form=item.get("absolute_url")
                    ))
        except Exception:
            # Graceful error handling: ATS endpoints might 404 for invalid company slug
            return []

        return jobs
