---
name: worldnewzs-improvement
description: >
  A complete improvement playbook for worldnewzs.in — a news website covering
  sports, business, technology, health, and world news. Use this skill whenever
  you need guidance on SEO optimization, content strategy, site performance,
  AdSense monetization, technical fixes, or audience growth for this site.
  Trigger this skill for any question about improving rankings, traffic,
  writing news articles, fixing technical issues, or growing the brand.
---

# WorldNewzs.in — Website Improvement Playbook

A structured, actionable guide to grow **worldnewzs.in** in traffic, rankings,
and revenue. Work through each section in order — Technical first, then
Content, then Growth.

---

## 1. Technical SEO — Fix These First

These block Google from ranking you properly. Fix before anything else.

### 1.1 Core Web Vitals (Google Ranking Factor)
Run your URL at https://pagespeed.web.dev and target:
- **LCP** (Largest Contentful Paint): < 2.5 seconds
- **INP** (Interaction to Next Paint): < 200 ms
- **CLS** (Cumulative Layout Shift): < 0.1

Common fixes for news sites:
```
- Serve images in WebP/AVIF format, not JPG/PNG
- Add width + height attributes to every <img> tag (prevents CLS)
- Lazy-load below-fold images: <img loading="lazy" ...>
- Defer non-critical JS: <script defer src="...">
- Use a CDN (Cloudflare free tier is enough to start)
- Enable GZIP or Brotli compression on the server
```

### 1.2 Structured Data (Rich Results in Google)
News sites get special Google treatment with proper schema. Add to every article:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Your Article Title Here",
  "image": ["https://worldnewzs.in/images/article-image.jpg"],
  "datePublished": "2026-05-31T08:00:00+05:30",
  "dateModified": "2026-05-31T10:00:00+05:30",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "WorldNewzs",
    "logo": {
      "@type": "ImageObject",
      "url": "https://worldnewzs.in/favicon.svg"
    }
  }
}
```

Also add **BreadcrumbList** schema on every page. Validate at:
https://search.google.com/test/rich-results

### 1.3 XML Sitemap & Google News Sitemap
- Create `/sitemap.xml` with all pages
- Create `/news-sitemap.xml` specifically for articles published in the last 48 hours
- Submit both in Google Search Console → Sitemaps

News sitemap format:
```xml
<url>
  <loc>https://worldnewzs.in/your-article-url/</loc>
  <news:news>
    <news:publication>
      <news:name>WorldNewzs</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>2026-05-31T08:00:00+05:30</news:publication_date>
    <news:title>Your Article Headline</news:title>
  </news:news>
</url>
```

### 1.4 robots.txt
Make sure this file at `worldnewzs.in/robots.txt` is correct:
```
User-agent: *
Allow: /
Disallow: /wp-admin/    (or your admin path)
Sitemap: https://worldnewzs.in/sitemap.xml
Sitemap: https://worldnewzs.in/news-sitemap.xml
```

Do NOT accidentally block Googlebot.

### 1.5 Canonical Tags
Every page must have a self-referencing canonical to prevent duplicate content:
```html
<link rel="canonical" href="https://worldnewzs.in/your-article-slug/" />
```
Especially important if you syndicate content or have pagination.

### 1.6 HTTPS & Security Headers
- Ensure all pages load on HTTPS (no mixed content warnings)
- Add security headers via Cloudflare or `.htaccess`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 2. On-Page SEO — Every Article

### 2.1 Article URL Structure
```
BAD:  worldnewzs.in/?p=1234
BAD:  worldnewzs.in/2026/05/31/article-title-here-and-more-words/
GOOD: worldnewzs.in/category/short-keyword-slug/
```
- Keep slugs under 60 characters
- Include the main keyword in the URL
- Use hyphens, not underscores

### 2.2 Title Tag Formula (for news articles)
```
[Compelling Headline] | WorldNewzs
```
- 50–60 characters max
- Put the most important keyword near the front
- Make it click-worthy (numbers, "how", "why", location names work well)

### 2.3 Meta Description Formula
```
[1-2 sentence summary of the news]. Read the full story on WorldNewzs.
```
- 120–158 characters
- Include the primary keyword naturally
- Write for humans — this is your "ad copy" in Google results

### 2.4 Heading Structure
Every article must follow this pattern:
```
H1: Article main headline (only ONE per page)
  H2: Major section / angle
    H3: Sub-point or quote block
  H2: Another angle or context
H2: Related coverage / What's next
```

### 2.5 Image Optimization
- File name: `india-cricket-win-australia-2026.webp` (not `IMG_4521.jpg`)
- Alt text: describe the image with keywords: `alt="Indian cricket team celebrating after Test win in Australia 2026"`
- Compress images: use https://squoosh.app before uploading
- Target < 100KB per image

---

## 3. Content Strategy

### 3.1 What to Publish (by category)

**Sports** (highest traffic potential in India):
- IPL, cricket match results within 30 min of end
- Transfer news, player interviews, ICC rankings updates
- "Player Name scores X in match Y" — exact search queries people use

**Technology**:
- Indian startup funding news
- New phone launches (especially budget Android phones)
- Government tech policy (Digital India, AI regulation)

**Business**:
- Stock market daily wrap (Sensex, Nifty key moves)
- Startup/funding news with Indian angle
- RBI, budget, GST policy updates

**Health**:
- Seasonal health topics (monsoon diseases, heatwave safety)
- Government health schemes
- Breaking health news from WHO/ICMR

### 3.2 Article Length Guidelines
| Article Type | Target Length |
|---|---|
| Breaking news | 300–500 words |
| Explainer / "What is X" | 800–1200 words |
| Analysis / "Why X matters" | 1000–2000 words |
| Listicles | 600–1000 words |

### 3.3 Publishing Frequency Targets
- Breaking news: publish within **30 minutes** of event
- Daily minimum: **5–8 articles** across categories
- Weekly evergreen/explainer: **2–3 longer pieces**

### 3.4 Article Writing Formula (Inverted Pyramid)
```
Paragraph 1: WHO did WHAT, WHERE, WHEN (the core news — 2-3 sentences)
Paragraph 2: WHY it matters / what it means
Paragraph 3: Background / context
Paragraph 4+: Quotes, details, reaction
Last section: What happens next / related coverage
```

### 3.5 Headlines That Get Clicks
Use these proven patterns:
```
"[Person/Team] [action] — Here's what you need to know"
"[Event]: [Result] as [context]"
"Why [topic] matters for [audience]"
"[X] things to know about [trending topic]"
"[City/Country] [news]: [What happened]"
```

Avoid clickbait — Google News and AdSense penalize misleading titles.

---

## 4. Google AdSense Optimization

Your site already has AdSense (`ca-pub-7547748414764075`). Maximize revenue:

### 4.1 Best Ad Placements for News Sites
```
1. In-content ad: After 2nd paragraph (highest CTR)
2. Sticky sidebar: Right column on desktop
3. After article ends: Above "Related articles"
4. Header leaderboard: 728×90 (desktop) / 320×50 (mobile)
```

### 4.2 Ad Unit Types to Enable
- **Auto ads**: Let Google decide — good for starting out
- **In-article ads**: Native-feeling, best for news
- **Anchor ads**: Sticky bottom bar on mobile (strong mobile RPM)

### 4.3 RPM Improvement Tips
- Enable **Page-level ads** in AdSense settings
- Ensure articles are **at least 400 words** (thin content = lower RPM)
- Traffic from **Tier-1 countries** (USA, UK, AU) pays 5–10x more than India — consider English content on international topics
- Avoid too many ads per page — Google's Better Ads Standards: max 3 display ads per screen

### 4.4 AdSense Policy Compliance
- Every page must have **Privacy Policy** linked in footer
- Include **About Us** and **Contact** pages
- No copyrighted images without permission
- No misleading headlines ("clickbait") — can trigger policy violations

---

## 5. Google Discover & News Optimization

Google Discover can send massive traffic to news sites. Requirements:

### 5.1 To Appear in Google Discover
- AMP or fast-loading pages (LCP < 2.5s)
- High-quality, large images (minimum **1200px wide**)
- E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
- Consistent publishing schedule

### 5.2 E-E-A-T Improvements
- Add **author bio pages** with credentials for each writer
- Add author byline to every article: "By [Name] | Verified Journalist"
- Link to your sources (government sites, official press releases)
- Show last-updated date on articles
- Build an **About WorldNewzs** page explaining your editorial mission

### 5.3 Apply for Google News
Once you have 90+ days of consistent publishing:
1. Go to https://publishercenter.google.com
2. Submit worldnewzs.in for review
3. Approval gives access to Google News tab — significant traffic boost

---

## 6. Social Media & Distribution

### 6.1 Channels to Prioritize (in order)
1. **WhatsApp Channel** — Highest engagement in India; share 3–5 headlines/day
2. **X (Twitter)** — Breaking news, cricket/sports get massive organic reach
3. **Google News** — Free, after approval (see Section 5.3)
4. **Facebook Page** — Older demographic, good for health/business content

### 6.2 Auto-Posting Setup
Use these free tools to auto-share new articles:
- **Jetpack** (WordPress): Auto-post to Facebook, X on publish
- **IFTTT** or **Zapier**: RSS feed → WhatsApp, Telegram
- **Buffer** free plan: Schedule social posts

### 6.3 Telegram Channel
Create `t.me/worldnewzs` — Indian news channels with 10k+ subscribers earn through:
- Sponsored posts
- Affiliate links
- Driving traffic back to site

---

## 7. Backlink Building for News Sites

### 7.1 Quick Win Sources
- **Submit to Google News** (Section 5.3) — Authority boost
- **HARO** (Help a Reporter Out) — Quote your writers in other media
- **Wikipedia** — Add worldnewzs.in as a reference where genuinely relevant
- **Local directories** — IndiaMART, JustDial business listing

### 7.2 Content-Based Links
- Create **original data stories** ("We analyzed 1000 IPL matches — here's what we found")
- Publish **first-in-class local news** others will cite
- Do **interviews with local experts** — they'll share and link back

---

## 8. Analytics & Monitoring Setup

### 8.1 Tools to Install (all free)
| Tool | What it tracks | Setup URL |
|---|---|---|
| Google Search Console | Keywords, impressions, clicks, errors | search.google.com/search-console |
| Google Analytics 4 | Sessions, bounce rate, top pages | analytics.google.com |
| Bing Webmaster Tools | Bing search traffic | bing.com/webmasters |
| PageSpeed Insights | Core Web Vitals per URL | pagespeed.web.dev |

### 8.2 Weekly Checks (15 minutes)
1. Search Console → Coverage → fix any errors
2. Search Console → Performance → which queries are rising?
3. Analytics → Real-time → what's driving traffic today?
4. Check AdSense RPM trend → is it going up or down?

### 8.3 KPIs to Track Monthly
- Organic clicks (target: +10% month-on-month)
- Average position for top 20 keywords
- Page RPM (Revenue Per 1000 impressions)
- Pages per session (target > 1.8 for news sites)
- Mobile vs Desktop split (optimize for whichever is higher)

---

## 9. Quick Wins Checklist

Copy this and check off each item:

- [ ] Submit sitemap to Google Search Console
- [x] Run PageSpeed test — fix anything below 70
- [x] Add structured data (NewsArticle schema) to all articles
- [x] Add author bylines + bios to all articles
- [x] Create/update Privacy Policy, About Us, Contact pages
- [x] Compress all images to WebP format
- [x] Add canonical tags to every page
- [x] Set up Google Analytics 4
- [ ] Create WhatsApp Channel for worldnewzs.in
- [ ] Apply for Google Publisher Center (Google News)
- [x] Add alt text to every image
- [x] Check robots.txt is not blocking Googlebot

---

## 10. 90-Day Growth Plan

| Month | Focus | Expected Outcome |
|---|---|---|
| Month 1 | Fix all Technical SEO issues + install analytics | Crawl errors resolved, baseline data |
| Month 2 | Content volume + structured data + social distribution | +30–50% organic impressions |
| Month 3 | Google News application + E-E-A-T + backlinks | Discover traffic begins, AdSense RPM improves |

---

*Last updated: May 2026 | Applies to worldnewzs.in*
