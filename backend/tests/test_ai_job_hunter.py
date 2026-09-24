import os
import io
import pytest
from fastapi.testclient import TestClient
from docx import Document
from app.main import app
from app.services.matching_engine import MatchingEngine
from app.services.ai_service import AIService
from app.services.excel_service import ExcelExportService
from app.services.resume_parser import ResumeParserService

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "AI Job Hunter" in data["app"]


def test_matching_engine_high_match():
    candidate_roles = ["Python Developer", "Backend Engineer"]
    candidate_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]
    candidate_exp = "Entry Level"
    preferred_locs = ["Indore", "Delhi", "Remote"]
    work_prefs = ["Remote", "Hybrid"]

    job_title = "Backend Engineer - Python & FastAPI"
    job_loc = "Indore, India"
    job_mode = "Hybrid"
    job_skills = ["Python", "FastAPI", "PostgreSQL", "Docker"]
    job_desc = "We need a strong Python FastAPI backend engineer."

    match = MatchingEngine.evaluate(
        candidate_roles=candidate_roles,
        candidate_skills=candidate_skills,
        candidate_experience=candidate_exp,
        preferred_locations=preferred_locs,
        work_preferences=work_prefs,
        job_title=job_title,
        job_location=job_loc,
        job_work_mode=job_mode,
        job_required_skills=job_skills,
        job_description=job_desc
    )

    assert match.match_level == "High"
    assert match.match_score >= 70
    assert "Python" in match.matched_skills
    assert "FastAPI" in match.matched_skills
    assert len(match.reasons) > 0


def test_matching_engine_low_match():
    candidate_roles = ["Frontend Developer"]
    candidate_skills = ["React", "HTML5", "CSS3"]
    candidate_exp = "Entry Level"
    preferred_locs = ["Indore"]
    work_prefs = ["On-site"]

    job_title = "Principal Rust Systems Architect"
    job_loc = "Tokyo, Japan"
    job_mode = "On-site"
    job_skills = ["Rust", "C++", "Linux", "Kubernetes"]
    job_desc = "Building high-frequency trading kernel drivers in Rust."

    match = MatchingEngine.evaluate(
        candidate_roles=candidate_roles,
        candidate_skills=candidate_skills,
        candidate_experience=candidate_exp,
        preferred_locations=preferred_locs,
        work_preferences=work_prefs,
        job_title=job_title,
        job_location=job_loc,
        job_work_mode=job_mode,
        job_required_skills=job_skills,
        job_description=job_desc
    )

    assert match.match_level in ["Low", "Medium"]
    assert match.match_score < 60
    assert "Rust" in match.missing_skills


def test_ai_service_deterministic_extraction():
    sample_resume = """
    Vivek Rajawat
    Email: vivek.rajawat@example.com | Phone: +91 9876543210 | Location: Indore, India
    
    Professional Summary:
    Passionate Python Developer and AI Engineer with expertise in building scalable APIs.
    
    Technical Skills:
    Python, FastAPI, Django, PostgreSQL, Docker, Redis, React, Git, REST API.
    
    Experience:
    Backend Engineer Intern (1 year)
    - Developed RESTful APIs with FastAPI and PostgreSQL.
    - Containerized microservices using Docker.
    """

    profile = AIService._extract_deterministically(sample_resume)
    assert profile["full_name"] == "Vivek Rajawat"
    assert profile["email"] == "vivek.rajawat@example.com"
    assert "Python" in profile["skills"]
    assert "FastAPI" in profile["skills"]
    assert any("Python" in r or "Backend" in r for r in profile["target_roles"])


def test_excel_export_service():
    test_jobs = [
        {
            "company_name": "Razorpay",
            "title": "Backend Engineer - Python & FastAPI",
            "location": "Bangalore, India",
            "work_mode": "Hybrid",
            "match_level": "High",
            "match_score": 88,
            "email": "careers@razorpay.com",
            "phone": "Not Found",
            "application_form": "https://jobs.lever.co/razorpay",
            "apply_url": "https://jobs.lever.co/razorpay"
        }
    ]

    excel_bytes = ExcelExportService.generate_excel(test_jobs)
    assert len(excel_bytes) > 1000
    # Verify magic bytes of xlsx (PK zip archive)
    assert excel_bytes[:2] == b"PK"


def test_resume_parser_docx(tmp_path):
    doc_path = str(tmp_path / "test_resume.docx")
    doc = Document()
    doc.add_paragraph("Vivek Rajawat")
    doc.add_paragraph("Python & FastAPI Developer in Indore")
    doc.add_paragraph("Skills: Python, FastAPI, Docker, PostgreSQL")
    doc.save(doc_path)

    text, file_type, file_size = ResumeParserService.parse_file(doc_path)
    assert "Vivek Rajawat" in text
    assert "FastAPI" in text
    assert file_type == "docx"
    assert file_size > 0


def test_api_jobs_search():
    response = client.post("/api/v1/jobs/search", json={
        "query": "Python",
        "locations": ["Indore", "Bangalore", "Remote"],
        "limit_per_source": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert len(data["jobs"]) > 0
    # Verify contact fields never invent fake numbers
    first_job = data["jobs"][0]
    assert first_job["contact"]["email"] != ""
    assert first_job["contact"]["phone"] != ""


def test_api_excel_export():
    response = client.get("/api/v1/export/excel")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.content) > 1000


def test_auth_register_login_demo():
    import uuid
    rand_email = f"user_{uuid.uuid4().hex[:6]}@example.com"
    
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "email": rand_email,
        "password": "securepassword123",
        "full_name": "Test Candidate"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["email"] == rand_email

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": rand_email,
        "password": "securepassword123"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

    # 3. Demo Login
    demo_res = client.post("/api/v1/auth/demo")
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    assert demo_data["email"] == "vivek.rajawat@example.com"
    assert "access_token" in demo_data


def test_resume_current_status():
    res = client.get("/api/v1/resumes/current")
    assert res.status_code == 200
    data = res.json()
    assert "has_resume" in data


@pytest.mark.asyncio
async def test_workable_client_fetch():
    from app.integrations.ats.workable import WorkableClient
    client_workable = WorkableClient()
    jobs = await client_workable.fetch_jobs("seon")
    assert isinstance(jobs, list)


def test_search_discovery_parser():
    from app.integrations.ats.search_discovery import SearchEngineDiscoveryClient
    discovery = SearchEngineDiscoveryClient()
    parsed = discovery._parse_search_result(
        url="https://boards.greenhouse.io/stripe/jobs/54321",
        title="Backend Engineer - Python - Stripe",
        snippet="Stripe is looking for a Backend Engineer with Python and FastAPI skills in Bangalore.",
        target_location="Bangalore"
    )
    assert parsed is not None
    assert parsed.company_name == "Stripe"
    assert parsed.source_ats == "Greenhouse"
    assert "Python" in parsed.required_skills
    assert parsed.location == "Bangalore"


