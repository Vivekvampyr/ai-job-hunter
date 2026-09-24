import asyncio
import httpx

candidates = [
    # AI / DevTools
    ("cursor", ["cursor", "anysphere"]),
    ("modal", ["modal", "modallabs"]),
    ("perplexity", ["perplexity", "perplexityai"]),
    ("llamaindex", ["llamaindex", "llama-index", "run-llama"]),
    ("langchain", ["langchain", "langchainai"]),
    ("together", ["together", "togetherai"]),
    ("mistral", ["mistral", "mistralai"]),
    ("vercel", ["vercel"]),
    ("supabase", ["supabase"]),
    ("resend", ["resend"]),
    ("postman", ["postman", "postmanlabs"]),
    ("hasura", ["hasura"]),
    ("retool", ["retool"]),
    # Indian Startups
    ("razorpay", ["razorpay", "razorpaysoftware"]),
    ("zepto", ["zepto", "zeptonow", "kirana-kart"]),
    ("cred", ["cred", "dreamplug"]),
    ("meesho", ["meesho"]),
    ("inmobi", ["inmobi"]),
    ("urbancompany", ["urbancompany", "urbanclap"]),
    ("browserstack", ["browserstack"]),
    ("clevertap", ["clevertap"]),
    # Fintech
    ("ramp", ["ramp"]),
    ("brex", ["brex"]),
    ("monzo", ["monzo"]),
]

async def check_slug(client, name, slug):
    # 1. Ashby
    try:
        r = await client.get(f"https://jobs.ashbyhq.com/api/non-personalized-feed/{slug}", timeout=3.0)
        if r.status_code == 200:
            jobs = r.json().get("jobs", [])
            if len(jobs) > 0:
                return (name, slug, "Ashby", len(jobs))
    except Exception:
        pass

    # 2. Greenhouse
    try:
        r = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs", timeout=3.0)
        if r.status_code == 200:
            jobs = r.json().get("jobs", [])
            if len(jobs) > 0:
                return (name, slug, "Greenhouse", len(jobs))
    except Exception:
        pass

    # 3. Lever
    try:
        r = await client.get(f"https://api.lever.co/v0/postings/{slug}?mode=json", timeout=3.0)
        if r.status_code == 200:
            jobs = r.json()
            if isinstance(jobs, list) and len(jobs) > 0:
                return (name, slug, "Lever", len(jobs))
    except Exception:
        pass

    return None

async def main():
    async with httpx.AsyncClient(timeout=4.0) as client:
        tasks = []
        for name, slugs in candidates:
            for s in slugs:
                tasks.append(check_slug(client, name, s))
        results = await asyncio.gather(*tasks)
        found = {}
        for res in results:
            if res:
                name, slug, ats, count = res
                if name not in found or count > found[name][2]:
                    found[name] = (slug, ats, count)
        
        print("\n=== VERIFIED STARTUP FEEDS ===")
        for name, (slug, ats, count) in sorted(found.items()):
            print(f"{name} -> {ats}: '{slug}' ({count} live jobs)")

if __name__ == "__main__":
    asyncio.run(main())
