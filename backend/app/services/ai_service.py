import re
import json
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.utils.text_helpers import extract_skills_from_text, extract_contact_info

COMMON_ROLE_PATTERNS = [
    (r"\b(?:python developer|python engineer|django developer|fastapi developer)\b", "Python Developer"),
    (r"\b(?:backend developer|backend engineer|backend lead)\b", "Backend Engineer"),
    (r"\b(?:frontend developer|frontend engineer|react developer|react engineer|vue developer|angular developer|ui engineer)\b", "Frontend Engineer"),
    (r"\b(?:full stack developer|full stack engineer|fullstack developer|fullstack engineer)\b", "Full Stack Developer"),
    (r"\b(?:ai engineer|machine learning engineer|ml engineer|data scientist|ai/ml engineer)\b", "AI Engineer"),
    (r"\b(?:data engineer|data analyst|bi engineer|analytics engineer)\b", "Data Engineer"),
    (r"\b(?:devops engineer|cloud engineer|sre|site reliability engineer|infrastructure engineer)\b", "DevOps Engineer"),
    (r"\b(?:mobile developer|android developer|ios developer|flutter developer|react native developer)\b", "Mobile Developer"),
    (r"\b(?:qa engineer|quality assurance|sdet|test automation engineer)\b", "QA Engineer"),
    (r"\b(?:product manager|technical product manager|project manager)\b", "Product Manager"),
    (r"\b(?:software engineer|software developer|sde|sde-1|sde-2|sde-3)\b", "Software Engineer"),
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
            skills = []

        # 4. Roles extraction
        roles = []
        text_lower = text.lower()
        for pattern, role_title in COMMON_ROLE_PATTERNS:
            if re.search(pattern, text_lower):
                roles.append(role_title)

        if not roles:
            # Fallback based on extracted top skills from resume
            if any(s in skills for s in ["React", "Vue", "Angular", "Next.js", "HTML5", "CSS3", "Tailwind CSS"]):
                roles.append("Frontend Engineer")
            if any(s in skills for s in ["Python", "FastAPI", "Django", "Flask", "Node.js", "Express", "Go", "Golang", "Java", "Spring Boot"]):
                roles.append("Backend Engineer")
            if any(s in skills for s in ["Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"]):
                roles.append("AI Engineer")
            if any(s in skills for s in ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "CI/CD"]):
                roles.append("DevOps Engineer")
            if not roles:
                roles = ["Software Engineer"]

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
        ) if skills else f"{name} is a software engineering candidate."

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
        """Generates dynamic, targeted job search queries strictly according to the candidate's resume."""
        # When no roles or skills exist (new account before resume upload)
        if not target_roles and not skills:
            return [
                "Software Engineer Remote",
                "Frontend Developer Remote",
                "Backend Engineer Remote",
                "Full Stack Developer Remote"
            ]

        queries = []
        primary_roles = [r for r in target_roles if r]
        if not primary_roles:
            primary_roles = ["Software Engineer"]

        locs = [l for l in preferred_locations if l]
        if not locs:
            locs = ["Remote"]

        # 1. Pair candidate's actual target roles with locations
        for role in primary_roles[:2]:
            for loc in locs[:2]:
                queries.append(f"{role} {loc}")
            if "Remote" not in locs:
                queries.append(f"{role} Remote")

        # 2. Pair candidate's top extracted resume skills with role & location
        if skills:
            top_skills = skills[:3]
            lead_role = primary_roles[0]
            for sk in top_skills:
                # Skill + Lead Role (e.g. "React Frontend Engineer" or "FastAPI Python Developer")
                if sk.lower() not in lead_role.lower():
                    queries.append(f"{sk} {lead_role}")
                queries.append(f"{sk} Developer Remote")
            if len(top_skills) >= 2:
                queries.append(f"{top_skills[0]} {top_skills[1]} Developer")

        # Deduplicate preserving order
        seen = set()
        deduped = []
        for q in queries:
            normalized = " ".join(q.split())
            if normalized.lower() not in seen:
                seen.add(normalized.lower())
                deduped.append(normalized)

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
