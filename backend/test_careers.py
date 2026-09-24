import asyncio
import httpx
import re

async def test_links(url):
    try:
        async with httpx.AsyncClient(headers={'User-Agent': 'Mozilla/5.0'}, follow_redirects=True, timeout=8.0) as c:
            r = await c.get(url)
            urls = set(re.findall(r'https?://[a-zA-Z0-9_\-\.\/\?\=\&\#]+', r.text))
            matches = [u for u in urls if any(k in u.lower() for k in ['greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters', 'myworkdayjobs', 'kula', 'instahyre'])]
            print(f"{url} -> found {len(matches)} links:")
            for m in matches[:5]:
                print(f"  {m}")
    except Exception as e:
        print(f"{url} -> error: {e}")

async def main():
    urls = [
        'https://www.postman.com/company/careers/',
        'https://retool.com/careers/',
        'https://hasura.io/careers/',
        'https://www.browserstack.com/careers',
        'https://clevertap.com/careers/',
        'https://www.zepto.com/careers',
        'https://www.urbancompany.com/careers',
    ]
    for u in urls:
        await test_links(u)

if __name__ == '__main__':
    asyncio.run(main())
