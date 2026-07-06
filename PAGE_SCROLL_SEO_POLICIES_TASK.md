# WorldNewzs (https://worldnewzs.in) Master Task & Compliance Control Document

This master document tracks all technical implementations, page controls, UX standards, search engine optimization (SEO), performance metrics, and policy compliance rules for the entire **WorldNewz** platform (`https://worldnewzs.in`).

---

## 1. Page Scroll Control & Navigation Standard (RESOLVED)

### Issue Description
Previously, clicking a `NewsCard` or navigating between pages left the viewport positioned at the scroll offset of the previous page or scrolled down automatically, creating an inconsistent and disorienting user experience on page load.

### Technical Solution
1. **Global Route Scroll Reset (`ScrollToTop.tsx`)**:
   - Implemented a global router observer `ScrollToTop` mounted at the root level inside `<App />`.
   - Utilizes `useLayoutEffect` watching `location.pathname` and `location.search`.
   - Automatically executes `window.scrollTo({ top: 0, left: 0, behavior: "instant" })` before browser paint on every route navigation or search query parameter change.
2. **Explicit Card Click Resets (`NewsCard.tsx` & `LocalNewsCard.tsx`)**:
   - Added explicit `window.scrollTo({ top: 0, left: 0, behavior: "instant" })` in `handleCardClick` prior to routing to `/article/:id`.
3. **Widget Navigation Correction (`TopEngagingNewsWidget.tsx`)**:
   - Replaced legacy `scrollTo({ top: 800 })` on the "See more" link with clean `window.scrollTo({ top: 0, behavior: "smooth" })` and redirection to `/trending`.

---

## 2. Page Hierarchy & Control Matrix (https://worldnewzs.in)

| Route Path | Page Name / Component | Scroll Control | SEO Meta | Ad Placement Standard |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Discover (Homepage) | Top Reset Active | Dynamic (`SEOMeta`) | Header Banner + In-Feed AdCards |
| `/politics` | Politics News | Top Reset Active | Dynamic (`SEOMeta`) | Sidebar + In-Feed AdCards |
| `/technology` | Technology News | Top Reset Active | Dynamic (`SEOMeta`) | Sidebar + In-Feed AdCards |
| `/business` | Business News | Top Reset Active | Dynamic (`SEOMeta`) | Sidebar + In-Feed AdCards |
| `/science-health` | Science & Health | Top Reset Active | Dynamic (`SEOMeta`) | Sidebar + In-Feed AdCards |
| `/sports` | Sports News | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/money` | Money & Finance | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/weather` | Weather Dashboard | Top Reset Active | Dynamic (`SEOMeta`) | Clean utility view |
| `/entertainment` | Entertainment News | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/lifestyle` | Lifestyle & Culture | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/education` | Education News | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/opinion` | Editorial & Opinion | Top Reset Active | Dynamic (`SEOMeta`) | Sidebar AdCards |
| `/trending` | Trending News | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/local-news` | Local News Hub | Top Reset Active | Dynamic (`SEOMeta`) | In-Feed AdCards |
| `/article/:id` | Article Result Page | Top Reset Active | `JSONLDNewsArticle` + `SEOMeta` | Article End AdCard + Sidebar |
| `/read-article/:id` | Full Article Reader | Top Reset Active | `JSONLDNewsArticle` + `SEOMeta` | Sidebar + Clean Reader |
| `/privacy-policy` | Privacy Policy | Top Reset Active | `SEOMeta` | Zero Ads (Policy requirement) |
| `/terms` | Terms & Conditions | Top Reset Active | `SEOMeta` | Zero Ads (Policy requirement) |
| `/about` | About Us | Top Reset Active | `SEOMeta` | Footer standard |
| `/contact` | Contact Us | Top Reset Active | `SEOMeta` | Footer standard |

---

## 3. Google Content Policies & AdSense Compliance Guidelines

### 3.1 Content Quality & Anti-Thin Content Standards
- **Word Count Targets**:
  - **Pillar Categories** (Politics, Technology, Business, Science-Health): **1,500–2,000 words**.
  - **Standard Categories** (Sports, Entertainment, Money, etc.): **600–1,000 words**.
  - **Minimum Threshold**: No article may be published under 300 words to ensure original editorial value.
- **Original Commentary**: Every news card and article detail page synthesizes key insights ("Why It Matters" takeaway box) to guarantee zero duplicate content penalty.
- **E-E-A-T Attribution**: Every article includes an explicit author byline linked to [AuthorBioPage](file:///c:/WorldNewz/worldnewz_UI/src/pages/AuthorBioPage.tsx) and accurate published/updated timestamps.

### 3.2 Google AdSense Layout & Separation Rules
- **Labeling**: All ad blocks utilize the standard `AdCard` component with mandatory `"Advertisement"` or `"Sponsored Content"` labels.
- **Ad Density Limit**: Ad coverage must never exceed **30%** of total page viewport area.
- **Click Protection**: Interactive controls (carousel arrows, menu buttons, pagination links) maintain a minimum 24px margin away from ad containers to eliminate accidental clicks.
- **Ads.txt**: Active at `/ads.txt` containing valid publisher account registration `google.com, pub-7547748414764075, DIRECT, f08c47fec0942fa0`.

---

## 4. Technical SEO Architecture

1. **Title & Meta Tags**: `react-helmet-async` injects dynamic `title`, `description`, `keywords`, `og:image`, `og:type`, and `twitter:card` per route.
2. **Canonical Links**: Automatically resolved to `https://worldnewzs.in/<pathname>`.
3. **Structured Data (Schema.org)**:
   - `NewsArticle` schema injected on all article detail routes.
   - `WebSite` & `Organization` schema injected on root layout.
   - `BreadcrumbList` schema injected across category navigation.

---

## 5. Performance Optimization & Core Web Vitals

1. **LCP Image Preloading**: The hero article image on detail pages is dynamically preloaded using `<link rel="preload" as="image" fetchpriority="high">`.
2. **Layout Shift Prevention (CLS)**: Explicit height aspect ratios are maintained on image wrappers, ad containers, and widget skeletons.
3. **Code Splitting**: All 35+ page components are lazily loaded (`React.lazy` and `Suspense`) in `main.tsx`, keeping initial bundle size minimal.

---

## 6. Sitemap.xml & Robots.txt Specifications

### 6.1 Sitemap Structure
- Main Sitemap: `https://worldnewzs.in/sitemap.xml` (Dynamically routed via serverless rewrite to `/api/sitemap`).
- News Sitemap: `https://worldnewzs.in/news-sitemap.xml` (Dynamically routed to `/api/news-sitemap` for last 48-hour news indexation).

### 6.2 Robots.txt Configuration (`/public/robots.txt`)
```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://worldnewzs.in/sitemap.xml
Sitemap: https://worldnewzs.in/news-sitemap.xml
```

---

## 7. Verification & Production Release Checklist

- [x] Create `ScrollToTop` component and integrate into `App.tsx`.
- [x] Update `handleCardClick` in `NewsCard.tsx` and `LocalNewsCard.tsx`.
- [x] Update `TopEngagingNewsWidget.tsx` link navigation to scroll to top.
- [x] Document page controls and policy standards in `PAGE_SCROLL_SEO_POLICIES_TASK.md`.
- [x] Log implementation updates in `IMPROVEMENTS.md`.
- [x] Build frontend application (`npm run build`) and verify zero errors.
- [x] Commit and push changes to production repository.
