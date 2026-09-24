import re
from typing import List, Tuple, Optional

# Comprehensive list of modern software engineering skills
TECH_SKILLS_TAXONOMY = [
    # Languages
    "Python", "JavaScript", "TypeScript", "Go", "Golang", "Rust", "Java", "C++", "C#", "Ruby", "PHP", "Kotlin", "Swift", "Scala", "SQL",
    # Backend Frameworks
    "FastAPI", "Django", "Flask", "Node.js", "Express", "NestJS", "Spring Boot", "Ruby on Rails", "ASP.NET", "Gin", "Fiber",
    # Frontend Frameworks & Libraries
    "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte", "Redux", "Tailwind CSS", "HTML5", "CSS3",
    # Databases & Caching
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "Elasticsearch", "DynamoDB", "Supabase", "Firebase",
    # Cloud, DevOps & Containers
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud", "Terraform", "CI/CD", "GitHub Actions", "GitLab CI", "Linux", "Nginx",
    # AI / ML & Data
    "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn", "OpenAI", "LangChain", "LLMs", "Vector DB",
    # Architecture & Messaging
    "Microservices", "REST API", "GraphQL", "gRPC", "Kafka", "RabbitMQ", "Celery", "WebSockets"
]

SKILL_PATTERNS = {
    skill: re.compile(rf"\b{re.escape(skill)}\b", re.IGNORECASE)
    for skill in TECH_SKILLS_TAXONOMY
}


def clean_html(text: str) -> str:
    """Removes HTML tags and normalizes whitespace."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"&[a-z]+;", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def extract_skills_from_text(text: str) -> List[str]:
    """Deterministically identifies known technical skills mentioned in text."""
    if not text:
        return []
    matched = []
    for skill, pattern in SKILL_PATTERNS.items():
        if pattern.search(text):
            matched.append(skill)
    return matched


def detect_work_mode(location_str: str, text: str) -> str:
    """Classifies work mode into Remote, Hybrid, or On-site."""
    combined = f"{location_str} {text}".lower()
    if "remote" in combined or "work from home" in combined or "anywhere" in combined or "distributed" in combined:
        return "Remote"
    elif "hybrid" in combined or "flexible" in combined:
        return "Hybrid"
    return "On-site"


def extract_contact_info(text: str) -> Tuple[str, str]:
    """Extracts valid public email and phone number from text.
    
    Constraint: Never invent emails or phone numbers. If unavailable,
    returns ('Not Found', 'Not Found').
    """
    if not text:
        return "Not Found", "Not Found"

    # Search for email with common recruitment keywords or standard email format
    email_regex = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    emails = re.findall(email_regex, text)
    
    # Filter out image/asset emails or bogus ones
    valid_email = "Not Found"
    for e in emails:
        e_lower = e.lower()
        if not any(ext in e_lower for ext in [".png", ".jpg", ".jpeg", ".svg", ".gif", "dummy@"]):
            if any(term in e_lower for term in ["jobs", "careers", "talent", "hr", "recruiting", "apply"]):
                valid_email = e
                break
            elif valid_email == "Not Found":
                valid_email = e

    # Phone regex (Indian/US/International numbers with + or digits)
    phone_regex = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
    phones = re.findall(phone_regex, text)
    valid_phone = phones[0].strip() if phones else "Not Found"

    return valid_email, valid_phone


KNOWN_LOCATION_KEYWORDS = {
    "indore", "delhi", "bangalore", "bengaluru", "pune", "hyderabad", 
    "gurgaon", "gurugram", "noida", "mumbai", "chennai", "india", 
    "remote", "usa", "us", "uk", "london", "europe", "germany", "berlin"
}


def matches_job_query(title: str, description: str, query: Optional[str] = None) -> bool:
    """Checks if a job title or description matches the user search query.
    
    Handles multi-word queries like 'Python Developer Indore' without rejecting
    jobs whose titles don't contain city names.
    """
    if not query or not query.strip():
        return True

    clean_q = query.strip().lower()
    # Direct substring match
    if clean_q in title.lower() or clean_q in description.lower():
        return True

    # Tokenize words
    tokens = [t for t in re.split(r"[\s,+/|-]+", clean_q) if len(t) >= 3]
    if not tokens:
        return True

    # Filter out location keywords when checking role/skill keywords in title/desc
    role_tokens = [t for t in tokens if t not in KNOWN_LOCATION_KEYWORDS]
    if not role_tokens:
        role_tokens = tokens

    # Title match has highest priority
    title_lower = title.lower()
    if any(t in title_lower for t in role_tokens):
        return True

    # Fallback: check if matched in description
    desc_lower = description.lower()
    return any(t in desc_lower for t in role_tokens)
