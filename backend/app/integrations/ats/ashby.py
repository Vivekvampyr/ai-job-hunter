from typing import List, Optional
import httpx
from app.integrations.ats.base import BaseATSClient, NormalizedJob
from app.utils.text_helpers import clean_html, extract_skills_from_text, detect_work_mode, extract_contact_info, matches_job_query


class AshbyClient(BaseATSClient):
    """Integrates with official Ashby public posting API.
    
    Endpoint: https://api.ashbyhq.com/posting-api/job-board/{company}
    """
    BASE_URL = "https://api.ashbyhq.com/posting-api/job-board"

    async def fetch_jobs(self, company_slug: str, query: Optional[str] = None, max_results: int = 8) -> List[NormalizedJob]:
        url = f"{self.BASE_URL}/{company_slug}"
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
                    raw_desc = item.get("descriptionHtml", "") or item.get("descriptionPlain", "")
                    clean_desc = clean_html(raw_desc)

                    if not matches_job_query(title, clean_desc, query):
                        continue

                    location_name = item.get("location", "Remote")
                    email_c, phone_c = extract_contact_info(clean_desc)
                    is_remote = item.get("isRemote", False)
                    work_mode = "Remote" if is_remote else detect_work_mode(location_name, clean_desc)
                    skills = extract_skills_from_text(f"{title} {clean_desc}")

                    NAME_MAP = {
                        "mistral.ai": ("Mistral AI", "https://mistral.ai"),
                        "cursor": ("Cursor", "https://cursor.com"),
                        "modal": ("Modal", "https://modal.com"),
                        "perplexity": ("Perplexity", "https://perplexity.ai"),
                        "llamaindex": ("LlamaIndex", "https://llamaindex.ai"),
                        "langchain": ("LangChain", "https://langchain.com"),
                        "supabase": ("Supabase", "https://supabase.com"),
                        "resend": ("Resend", "https://resend.com"),
                        "ramp": ("Ramp", "https://ramp.com"),
                        "linear": ("Linear", "https://linear.app"),
                        "synthesia": ("Synthesia", "https://synthesia.io"),
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
                        external_id=f"ashby_{item.get('id')}",
                        title=title,
                        location=location_name,
                        work_mode=work_mode,
                        required_skills=skills,
                        description=clean_desc[:2000],
                        apply_url=item.get("jobUrl", f"https://jobs.ashbyhq.com/{company_slug}/{item.get('id')}"),
                        source_ats="Ashby",
                        email_contact=email_c,
                        phone_contact=phone_c,
                        application_form=item.get("jobUrl")
                    ))
        except Exception:
            return []

        return jobs
