import re
import json
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.utils.text_helpers import extract_skills_from_text, extract_contact_info

COMMON_ROLE_PATTERNS = [
    (r"\b(?:python developer|python engineer|backend developer|backend engineer)\b", "Python Developer"),
    (r"\b(?:fastapi developer|fastapi engineer)\b", "FastAPI Engineer"),
    (r"\b(?:full stack developer|full stack engineer|fullstack developer)\b", "Full Stack Developer"),
    (r"\b(?:ai engineer|machine learning engineer|ml engineer|data scientist)\b", "AI Engineer"),
    (r"\b(?:software engineer|software developer|sde)\b", "Software Engineer"),
    (r"\b(?:frontend developer|react developer|frontend engineer)\b", "Frontend Engineer"),
    (r"\b(?:devops engineer|cloud engineer|sre)\b", "DevOps Engineer"),
]


class AIService:
    """Provides AI-driven extraction and cold email generation with deterministic fallbacks."""

    @classmethod
    async def extract_candidate_profile(cls, raw_resume_text: str) -> Dict[str, Any]:
        """Extracts structured candidate profile from resume text.
        
        Uses Gemini/OpenAI if configured, else applies robust deterministic NLP.
        """
        if settings.GEMINI_API_KEY:
            try:
                ai_data = await cls._extract_with_gemini(raw_resume_text)
                if ai_data:
                    return ai_data
            except Exception:
                pass

        if settings.OPENAI_API_KEY:
            try:
                ai_data = await cls._extract_with_openai(raw_resume_text)
                if ai_data:
                    return ai_data
            except Exception:
                pass

        # Deterministic Rule-Based Extraction Fallback
        return cls._extract_deterministically(raw_resume_text)

    @classmethod
    def _extract_deterministically(cls, text: str) -> Dict[str, Any]:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # 1. Candidate Name (usually the first non-empty line of the resume)
        name = "Candidate"
        if lines:
            first_line = lines[0]
            if len(first_line.split()) <= 4 and not any(char in first_line for char in ["@", "http", "www", "+"]):
                name = first_line.title()
            elif len(lines) > 1 and len(lines[1].split()) <= 4:
                name = lines[1].title()

        # 2. Contact details
        email, phone = extract_contact_info(text)

        # 3. Skills extraction
        skills = extract_skills_from_text(text)
        if not skills:
            skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"]

        # 4. Roles extraction
        roles = []
        text_lower = text.lower()
        for pattern, role_title in COMMON_ROLE_PATTERNS:
            if re.search(pattern, text_lower):
                roles.append(role_title)

        if not roles:
            if "python" in skills:
                roles.extend(["Python Developer", "Backend Engineer"])
            if "ai" in text_lower or "machine learning" in text_lower:
                roles.append("AI Engineer")
            if not roles:
                roles = ["Software Engineer", "Backend Developer"]

        # Deduplicate roles preserving order
        unique_roles = list(dict.fromkeys(roles))

        # 5. Experience level estimation
        years_match = re.findall(r"(\d+)\+?\s*(?:years|yrs)\b", text_lower)
        experience_level = "Entry Level"
        if years_match:
            max_years = max([int(y) for y in years_match if int(y) < 40], default=0)
            if max_years >= 6:
                experience_level = "Senior Level"
            elif max_years >= 2:
                experience_level = "Mid Level"
            else:
                experience_level = "Entry Level"
        elif any(term in text_lower for term in ["senior", "lead", "architect", "principal"]):
            experience_level = "Senior Level"
        elif any(term in text_lower for term in ["intern", "graduate", "fresher", "junior"]):
            experience_level = "Entry Level"

        summary = (
            f"{name} is an ambitious {experience_level.lower()} professional specializing in "
            f"{', '.join(unique_roles[:2])}. Proficient in core modern technologies including "
            f"{', '.join(skills[:5])}."
        )

        return {
            "full_name": name,
            "email": email if email != "Not Found" else None,
            "phone": phone if phone != "Not Found" else None,
            "target_roles": unique_roles,
            "skills": skills,
            "experience_level": experience_level,
            "summary": summary
        }

    @classmethod
    def generate_search_queries(
        cls,
        target_roles: List[str],
        preferred_locations: List[str],
        skills: List[str]
    ) -> List[str]:
        """Generates dynamic, targeted job search queries for public ATS boards."""
        queries = []
        primary_roles = target_roles[:3] or ["Software Engineer", "Python Developer"]
        locs = preferred_locations[:3] or ["Remote", "Bangalore", "Delhi"]

        # Pair primary roles with locations
        for role in primary_roles:
            for loc in locs:
                queries.append(f"{role} {loc}")

        # Pair key skill with role and location
        top_skill = skills[0] if skills else "Python"
        queries.append(f"{top_skill} Backend Engineer Remote")
        queries.append(f"{top_skill} Developer India")

        # Deduplicate
        seen = set()
        deduped = []
        for q in queries:
            if q.lower() not in seen:
                seen.add(q.lower())
                deduped.append(q)

        return deduped[:8]

    @classmethod
    async def generate_application_email(
        cls,
        candidate_name: str,
        candidate_skills: List[str],
        job_title: str,
        company_name: str,
        matched_skills: List[str],
        tone: str = "confident and professional"
    ) -> Dict[str, str]:
        """Generates a high-converting, personalized cold outreach email tailored to the role."""
        if settings.GEMINI_API_KEY:
            try:
                ai_email = await cls._generate_email_with_gemini(
                    candidate_name, candidate_skills, job_title, company_name, matched_skills, tone
                )
                if ai_email:
                    return ai_email
            except Exception:
                pass

        return cls._generate_email_template(
            candidate_name, candidate_skills, job_title, company_name, matched_skills
        )

    @classmethod
    def _generate_email_template(
        cls,
        candidate_name: str,
        candidate_skills: List[str],
        job_title: str,
        company_name: str,
        matched_skills: List[str]
    ) -> Dict[str, str]:
        skills_pitch = ", ".join(matched_skills[:4]) if matched_skills else ", ".join(candidate_skills[:4])
        subject = f"Application: {job_title} - {candidate_name}"
        body = (
            f"Dear {company_name} Hiring Team,\n\n"
            f"I am writing to express my enthusiastic interest in the {job_title} position at {company_name}. "
            f"With strong hands-on experience in {skills_pitch}, I have built reliable, production-ready systems "
            f"and APIs that deliver measurable results.\n\n"
            f"Having followed {company_name}'s recent work, I would love the opportunity to contribute my skills "
            f"to help scale your technical infrastructure and solve high-impact challenges.\n\n"
            f"I have attached my resume for your review. I look forward to the possibility of discussing how "
            f"my background can support {company_name}'s immediate engineering goals.\n\n"
            f"Thank you for your time and consideration.\n\n"
            f"Warm regards,\n"
            f"{candidate_name}\n"
        )
        return {"subject": subject, "body": body}

    @classmethod
    async def _generate_email_with_gemini(
        cls,
        candidate_name: str,
        candidate_skills: List[str],
        job_title: str,
        company_name: str,
        matched_skills: List[str],
        tone: str = "confident and professional"
    ) -> Optional[Dict[str, str]]:
        models_to_try = [
            getattr(settings, "GEMINI_MODEL", "gemini-3.1-flash-lite"),
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
        ]
        prompt = (
            f"Draft a high-converting, personalized job application cold email.\n"
            f"Candidate Name: {candidate_name}\n"
            f"Role Applied: {job_title}\n"
            f"Company: {company_name}\n"
            f"Key Matched Skills: {', '.join(matched_skills or candidate_skills[:4])}\n"
            f"Tone: {tone}\n\n"
            f"Return ONLY a JSON object with two fields:\n"
            f"\"subject\": string (e.g. Application: {job_title} - {candidate_name})\n"
            f"\"body\": string (clean, professional email body, no markdown hashes, sign off with {candidate_name})"
        )
        async with httpx.AsyncClient(timeout=15.0) as client:
            for model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
                try:
                    resp = await client.post(url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json"}
                    })
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_out = data["candidates"][0]["content"]["parts"][0]["text"]
                        clean_json = re.sub(r"^```json\s*|\s*```$", "", raw_out.strip(), flags=re.MULTILINE)
                        res = json.loads(clean_json)
                        if "subject" in res and "body" in res:
                            return res
                except Exception:
                    continue
        return None

    @classmethod
    async def _extract_with_gemini(cls, text: str) -> Optional[Dict[str, Any]]:
        models_to_try = [
            getattr(settings, "GEMINI_MODEL", "gemini-3.1-flash-lite"),
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash",
        ]
        seen = set()
        models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

        prompt = (
            "Extract candidate profile from resume text. Return ONLY a valid JSON object with keys: "
            "full_name (string), email (string or null), phone (string or null), "
            "target_roles (list of strings), skills (list of strings), "
            "experience_level (Entry Level, Mid Level, or Senior Level), summary (string).\n\n"
            f"Resume Text:\n{text[:4000]}"
        )
        async with httpx.AsyncClient(timeout=15.0) as client:
            for model in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
                try:
                    resp = await client.post(url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json"}
                    })
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_out = data["candidates"][0]["content"]["parts"][0]["text"]
                        clean_json = re.sub(r"^```json\s*|\s*```$", "", raw_out.strip(), flags=re.MULTILINE)
                        return json.loads(clean_json)
                except Exception:
                    continue
        return None

    @classmethod
    async def _extract_with_openai(cls, text: str) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = (
            "Extract candidate profile from resume text. Return ONLY a valid JSON object with keys: "
            "full_name (string), email (string or null), phone (string or null), "
            "target_roles (list of strings), skills (list of strings), "
            "experience_level (Entry Level, Mid Level, or Senior Level), summary (string).\n\n"
            f"Resume Text:\n{text[:4000]}"
        )
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            })
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        return None
