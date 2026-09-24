import asyncio
import httpx

candidates = [
    # AI & DevTools
    ('mistral', 'lever', 'mistral'),
    ('mistral', 'greenhouse', 'mistralai'),
    ('postman', 'greenhouse', 'postman'),
    ('hasura', 'lever', 'hasura'),
    ('hasura', 'greenhouse', 'hasura'),
    ('retool', 'greenhouse', 'retool'),
    ('retool', 'ashby', 'retool'),
    # Indian Startups
    ('razorpay', 'lever', 'razorpay'),
    ('razorpay', 'greenhouse', 'razorpay'),
    ('zepto', 'greenhouse', 'zepto'),
    ('zepto', 'lever', 'zepto'),
    ('urbancompany', 'greenhouse', 'urbancompany'),
    ('urbancompany', 'lever', 'urbancompany'),
    ('browserstack', 'greenhouse', 'browserstack'),
    ('browserstack', 'lever', 'browserstack'),
    ('clevertap', 'greenhouse', 'clevertap'),
    ('clevertap', 'lever', 'clevertap'),
]

async def check(client, name, ats, slug):
    try:
        if ats == 'greenhouse':
            r = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs")
            if r.status_code == 200:
                jobs = r.json().get('jobs', [])
                if jobs:
                    print(f"MATCH: {name} on Greenhouse -> '{slug}' ({len(jobs)} jobs)", flush=True)
        elif ats == 'lever':
            r = await client.get(f"https://api.lever.co/v0/postings/{slug}?mode=json")
            if r.status_code == 200:
                jobs = r.json()
                if isinstance(jobs, list) and len(jobs) > 0:
                    print(f"MATCH: {name} on Lever -> '{slug}' ({len(jobs)} jobs)", flush=True)
        elif ats == 'ashby':
            r = await client.get(f"https://api.ashbyhq.com/posting-api/job-board/{slug}")
            if r.status_code == 200:
                jobs = r.json().get('jobs', [])
                if jobs:
                    print(f"MATCH: {name} on Ashby -> '{slug}' ({len(jobs)} jobs)", flush=True)
    except Exception as e:
        pass

async def main():
    async with httpx.AsyncClient(timeout=4.0) as client:
        tasks = [check(client, n, a, s) for n, a, s in candidates]
        await asyncio.gather(*tasks)

if __name__ == '__main__':
    asyncio.run(main())
