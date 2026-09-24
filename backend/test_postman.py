import httpx
import re

r = httpx.get('https://www.postman.com/company/careers/open-positions/', headers={'User-Agent': 'Mozilla/5.0'})
links = re.findall(r'href="([^"]*job[^"]*)"', r.text, re.IGNORECASE)
print('Job links count:', len(links))
for l in links[:10]:
    print('  ', l)
scripts = re.findall(r'<script[^>]+src="([^"]+)"', r.text)
print('Scripts count:', len(scripts))
for s in scripts:
    if any(k in s.lower() for k in ['career', 'job', 'ats', 'greenhouse', 'lever']):
        print('  script:', s)
