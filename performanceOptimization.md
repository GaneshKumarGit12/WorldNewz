# Performance Optimization Skill — worldnewzs.in

A practical, repeatable playbook for diagnosing and fixing slow page loads on a
multi-category news/aggregator site (30+ sections, live trackers, ads, chatbot,
quizzes). Use this as a checklist every time performance is reviewed.

---

## 1. Diagnose First (don't guess)

Run these before changing anything, and re-run after each fix to confirm impact:

| Tool | What it tells you |
|---|---|
| Google PageSpeed Insights (pagespeed.web.dev) | Core Web Vitals (LCP, INP, CLS), field + lab data |
| Chrome DevTools → Lighthouse | Render-blocking resources, unused JS/CSS, image sizing |
| Chrome DevTools → Network tab | Waterfall — which requests are slowest, TTFB, request count |
| WebPageTest.org | Multi-location, multi-device testing, filmstrip view |
| GTmetrix | Historical trend tracking |

Target metrics: **LCP < 2.5s, INP < 200ms, CLS < 0.1, TTFB < 600ms.**

Check the **homepage AND at least one article/category page** — aggregator
sites often have a fast static homepage but a slow dynamic listing page.

---

## 2. Likely Bottlenecks for This Type of Site

Given the structure (news aggregation + ads + live features + chatbot):

- **Ad scripts (AdSense)** — often the single biggest slowdown; each ad unit
  loads its own JS, makes auction calls, and can block rendering.
- **Third-party embeds** — chatbot widget, trending videos, social embeds —
  each adds its own JS bundle and network round-trip.
- **Live/dynamic data pages** — stock tracker, opinion polls, quiz
  leaderboard — if these hit the database/API on every page load without
  caching, TTFB balloons.
- **Unoptimized images** — logo, article thumbnails, og:images served at
  full resolution instead of responsive sizes.
- **No/weak caching layer** — every visitor regenerating the same news
  listing page from scratch.
- **Render-blocking CSS/JS** — large bundles loaded synchronously in `<head>`.
- **Too many navigation links rendered server-side on every page** (30+ nav
  items in the DOM on every single page load).

---

## 3. Fixes, Ranked by Impact vs. Effort

### Quick wins (do first, low effort)
- [ ] Enable **Gzip or Brotli compression** on the server/CDN.
- [ ] Add `loading="lazy"` to all below-the-fold images (article thumbnails,
      trending video previews).
- [ ] Convert images to **WebP/AVIF** and serve responsive sizes via
      `srcset` (don't ship a 1200px image to a 300px thumbnail slot).
- [ ] Add `preconnect`/`dns-prefetch` for critical third-party origins
      (ad network, chatbot widget, font CDN).
- [ ] Defer or `async` all non-critical JS (analytics, ad scripts, chat
      widget) so they don't block the initial render.
- [ ] Set long-lived cache headers (`Cache-Control: max-age=31536000,
      immutable`) for static assets (logo SVG, CSS, JS bundles) with
      fingerprinted filenames.

### Medium effort, high impact
- [ ] Put the whole site behind a **CDN** (Cloudflare, Fastly, or similar) so
      static/near-static pages are served from edge nodes near the user
      instead of hitting origin every time.
- [ ] **Cache dynamic listing pages** (category pages, homepage) at the
      edge/server for 30–120 seconds using stale-while-revalidate — news
      doesn't need to be regenerated per-request.
- [ ] For the **stock tracker / polls / quiz leaderboard**: cache API
      responses server-side (Redis) for a short TTL instead of hitting the
      DB per request; push live updates via WebSocket only where truly needed.
- [ ] Reduce the number of ad units above the fold, or lazy-load ads that
      are below the fold — load them only when they scroll into view.
- [ ] Minify and bundle CSS/JS, and split bundles per route (code-splitting)
      so the badge-quiz JS doesn't load on the sports page, etc.
- [ ] Move the chatbot widget to load **on interaction** (click to open)
      rather than eagerly on every page load.

### Bigger structural changes (highest impact, more effort)
- [ ] Move article/category pages to **static generation or ISR**
      (Incremental Static Regeneration, e.g. Next.js/Astro) — pre-render
      news pages at build/publish time and revalidate every few minutes,
      instead of rendering fresh on every request.
- [ ] Use an **image CDN** (Cloudinary, imgix, or Cloudflare Images) that
      auto-resizes/optimizes on the fly per device.
- [ ] Audit and trim the global navigation — 30+ links server-rendered on
      every page adds DOM weight sitewide; consider a mega-menu that loads
      the full list client-side/lazily.
- [ ] Set up **HTTP/2 or HTTP/3** on the origin/CDN if not already active.
- [ ] Move heavy backend logic (leaderboard ranking, poll aggregation) to a
      scheduled job that writes a cached summary, rather than computing it
      live on each request.

---

## 4. Maintaining Speed Over Time

- [ ] Add **Core Web Vitals monitoring** (Google Search Console → Core Web
      Vitals report, or a RUM tool) and check monthly.
- [ ] Set a **performance budget** (e.g., homepage JS < 300KB gzipped, LCP
      < 2.5s) and block deploys that regress past it if using CI.
- [ ] Re-run Lighthouse after adding any new widget, ad unit, or embed —
      third-party scripts are the most common source of regression.
- [ ] Periodically audit unused CSS/JS (Lighthouse "Reduce unused
      JavaScript/CSS") as the site grows more categories.
- [ ] Review the ad setup with your ad network for **lazy-loading /
      deferred ad** options — most networks support this.

---

## 5. Suggested Immediate Next Step

Run PageSpeed Insights on `https://worldnewzs.in` and one category page
(e.g. `/sports`), and look at the "Diagnostics" section — it will point to
the exact largest offenders (usually: unoptimized images, render-blocking
ad/chat scripts, or slow server response). Fix those first; they typically
account for 60-80% of perceived slowness on sites like this.
