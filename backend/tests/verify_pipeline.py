import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 60)
print("RUNNING AI JOB HUNTER E2E PIPELINE VERIFICATION")
print("=" * 60)

# 1. Health check
res = client.get("/health")
assert res.status_code == 200
print("[OK] Health Check passed:", res.json())

# 2. Upload sample resume
resume_path = "sample_resume_vivek_rajawat.docx"
with open(resume_path, "rb") as f:
    upload_res = client.post("/api/v1/resumes/upload", files={"file": ("sample_resume_vivek_rajawat.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})

assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
print("[OK] Resume uploaded successfully:", upload_res.json()["message"])

# 3. Check candidate profile
profile_res = client.get("/api/v1/profiles")
assert profile_res.status_code == 200
profile = profile_res.json()
print(f"[OK] Profile extracted: Name='{profile['full_name']}', Roles={profile['target_roles']}, Skills count={len(profile['skills'])}")
print(f"[OK] Generated Search Queries: {profile['search_queries']}")

# 4. Search jobs on public ATS boards
search_res = client.post("/api/v1/jobs/search", json={
    "query": "Python",
    "locations": ["Indore", "Delhi", "Bangalore", "Remote"],
    "work_modes": ["Remote", "Hybrid"]
})
assert search_res.status_code == 200
jobs_data = search_res.json()
print(f"[OK] Discovered {len(jobs_data['jobs'])} jobs matching candidate preferences!")

# 5. Check match results on first job
first_job = jobs_data["jobs"][0]
match = first_job["match"]
print(f"[OK] Top Matched Job: '{first_job['title']}' at '{first_job['company_name']}'")
print(f"     Match Level: {match['match_level']} ({match['match_score']}%)")
print(f"     Matched Skills: {match['matched_skills']}")
print(f"     Missing Skills: {match['missing_skills']}")
print(f"     Contact Email: {first_job['contact']['email']} | Phone: {first_job['contact']['phone']}")

# 6. Generate Cold Outreach Email
email_res = client.post("/api/v1/applications/generate-email", json={"job_id": first_job["id"]})
assert email_res.status_code == 200
email_draft = email_res.json()
print(f"[OK] Generated Cold Outreach Email:")
print(f"     Subject: {email_draft['subject']}")
print(f"     Attached Resume: {email_draft['resume_file_name']}")
print(f"     Recipient: {email_draft['recipient_email']}")

# 7. Test Excel export
excel_res = client.get("/api/v1/export/excel")
assert excel_res.status_code == 200
assert len(excel_res.content) > 1000
print(f"[OK] Excel Export generated successfully ({len(excel_res.content)} bytes)")

# 8. Test sending application (draft mode)
send_res = client.post("/api/v1/applications/send", json={
    "job_id": first_job["id"],
    "recipient_email": "careers@example.com",
    "subject": email_draft["subject"],
    "body": email_draft["body"],
    "attach_resume": True,
    "save_as_draft": True
})
assert send_res.status_code == 200
app_record = send_res.json()
print(f"[OK] Application successfully recorded! Status={app_record['status']}, Match={app_record['match_level']}")

print("=" * 60)
print("ALL E2E PIPELINE STEPS VERIFIED 100% SUCCESSFULLY!")
print("=" * 60)
