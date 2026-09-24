import httpx

login = httpx.post('http://127.0.0.1:8000/api/v1/auth/demo', timeout=5.0)
token = login.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

print('Starting search for Python Developer...')
search_res = httpx.post('http://127.0.0.1:8000/api/v1/jobs/search', json={'query': 'Python Developer'}, headers=headers, timeout=12.0)
print('Search status:', search_res.status_code)
search_data = search_res.json()
jobs = search_data.get('jobs', [])
print(f"Found jobs count: {len(jobs)}, Total: {search_data.get('total')}")
for j in jobs[:8]:
    print(f" - {j['company_name']}: {j['title']} ({j['source_ats']}) | {j['location']}")
