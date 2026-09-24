import re
import urllib.parse
from typing import List, Optional
import httpx
from app.core.config import settings
from app.integrations.ats.base import NormalizedJob
from app.utils.text_helpers import extract_skills_from_text, detect_work_mode, clean_html, extract_contact_info


class SearchEngineDiscoveryClient:
    """Discovers live public ATS postings and company career pages via Search Engine queries
    
    (Google Custom Search API or public search discovery).
    Strictly queries public ATS domains:
    - boards.greenhouse.io
    - jobs.lever.co
    - jobs.ashbyhq.com
    - apply.workable.com
    """

    SUPPORTED_ATS_DOMAINS = [
        "boards.greenhouse.io",
        "jobs.lever.co",
        "jobs.ashbyhq.com",
        "apply.workable.com"
    ]

    async def discover_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit: int = 10
    ) -> List[NormalizedJob]:
        if not settings.ENABLE_SEARCH_ENGINE_DISCOVERY:
            return []

        # If Google Custom Search API key is present, use Google Custom Search
        if settings.GOOGLE_SEARCH_API_KEY and settings.GOOGLE_SEARCH_ENGINE_ID:
            google_jobs = await self._discover_via_google(query, location, limit)
            if google_jobs:
                return google_jobs

        # Fallback to public search discovery
        return await self._discover_via_public_search(query, location, limit)

    async def _discover_via_google(
        self,
        query: str,
        location: Optional[str] = None,
        limit: int = 10
    ) -> List[NormalizedJob]:
        site_filter = " OR ".join([f"site:{d}" for d in self.SUPPORTED_ATS_DOMAINS])
        search_query = f"({site_filter}) {query}"
        if location:
            search_query += f' "{location}"'

        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": settings.GOOGLE_SEARCH_API_KEY,
            "cx": settings.GOOGLE_SEARCH_ENGINE_ID,
            "q": search_query,
            "num": min(limit, 10)
        }

        discovered_jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                if res.status_code != 200:
                    return []
                data = res.json()
                items = data.get("items", [])

                for item in items:
                    link = item.get("link", "")
                    title = item.get("title", "")
                    snippet = item.get("snippet", "")
                    norm_job = self._parse_search_result(link, title, snippet, location)
                    if norm_job:
                        discovered_jobs.append(norm_job)
        except Exception:
            pass

        return discovered_jobs

    async def _discover_via_public_search(
        self,
        query: str,
        location: Optional[str] = None,
        limit: int = 10
    ) -> List[NormalizedJob]:
        """Performs public search discovery on ATS domains."""
        site_filter = " OR ".join([f"site:{d}" for d in self.SUPPORTED_ATS_DOMAINS])
        search_query = f"({site_filter}) {query}"
        if location:
            search_query += f' "{location}"'

        encoded_q = urllib.parse.quote_plus(search_query)
        search_url = f"https://html.duckduckgo.com/html/?q={encoded_q}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        discovered_jobs: List[NormalizedJob] = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(search_url, headers=headers)
                if res.status_code != 200:
                    return []
                html = res.text

                # Extract result URLs and titles using regex
                link_matches = re.findall(
                    r'<a class="result__url" href="([^"]+)".*?<h2 class="result__title">.*?<a.*?>(.*?)</a>.*?<a class="result__snippet".*?>(.*?)</a>',
                    html,
                    re.DOTALL
                )

                for raw_link, raw_title, raw_snippet in link_matches[:limit]:
                    clean_title = clean_html(raw_title)
                    clean_snippet = clean_html(raw_snippet)
                    
                    # Resolve DDG redirect URL if needed
                    actual_link = raw_link
                    if "uddg=" in raw_link:
                        actual_link = urllib.parse.unquote(raw_link.split("uddg=")[1].split("&")[0])

                    norm_job = self._parse_search_result(actual_link, clean_title, clean_snippet, location)
                    if norm_job:
                        discovered_jobs.append(norm_job)
        except Exception:
            pass

        return discovered_jobs

    def _parse_search_result(
        self,
        url: str,
        title: str,
        snippet: str,
        target_location: Optional[str] = None
    ) -> Optional[NormalizedJob]:
        """Parses a search result into a NormalizedJob object."""
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname or ""
        path_parts = [p for p in parsed.path.split("/") if p]

        company_name = "Tech Company"
        source_ats = "Search Discovery"

        if "greenhouse.io" in hostname:
            source_ats = "Greenhouse"
            if len(path_parts) >= 1:
                company_name = path_parts[0].replace("-", " ").title()
        elif "lever.co" in hostname:
            source_ats = "Lever"
            if len(path_parts) >= 1:
                company_name = path_parts[0].replace("-", " ").title()
        elif "ashbyhq.com" in hostname:
            source_ats = "Ashby"
            if len(path_parts) >= 1:
                company_name = path_parts[0].replace("-", " ").title()
        elif "workable.com" in hostname:
            source_ats = "Workable"
            if len(path_parts) >= 1:
                company_name = path_parts[0].replace("-", " ").title()
        else:
            return None

        # Clean title (often contains " - Company Name" or "Job Application for...")
        clean_title = title
        for prefix in ["Job Application for ", "Careers at "]:
            if clean_title.startswith(prefix):
                clean_title = clean_title[len(prefix):]
        if " - " in clean_title:
            clean_title = clean_title.split(" - ")[0]
        if " | " in clean_title:
            clean_title = clean_title.split(" | ")[0]

        loc = target_location or "Remote"
        work_mode = detect_work_mode(loc, f"{title} {snippet}")
        skills = extract_skills_from_text(f"{title} {snippet}")
        email_c, phone_c = extract_contact_info(snippet)

        external_id = f"search_{abs(hash(url))}"

        return NormalizedJob(
            company_name=company_name,
            company_website=f"https://www.google.com/search?q={company_name}",
            company_ats_slug=path_parts[0] if path_parts else None,
            external_id=external_id,
            title=clean_title or "Software Engineer",
            location=loc,
            work_mode=work_mode,
            required_skills=skills,
            description=snippet or f"Discovered public opening at {company_name} for {clean_title}.",
            apply_url=url,
            source_ats=source_ats,
            email_contact=email_c,
            phone_contact=phone_c,
            application_form=url
        )
