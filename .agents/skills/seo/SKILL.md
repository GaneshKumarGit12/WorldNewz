---
name: worldnewz-seo-agent
description: >
  Full-stack SEO automation skill for WorldNewz (world-newz.vercel.app).
  Trigger this skill for ANY SEO task on the WorldNewz platform: technical audits,
  keyword research and daily keyword automation, sitemap generation, robots.txt,
  JSON-LD schema markup, Open Graph / Twitter Cards, Core Web Vitals, Privacy Policy,
  Terms & Conditions, on-page optimization, E-E-A-T content scoring, GEO (AI search
  visibility), canonical tags, hreflang, structured data validation, and Google Search
  Console integration. Applies to BOTH the React + Vite + TypeScript frontend and the
  ASP.NET Core backend. Use whenever the user mentions SEO, meta tags, sitemap,
  robots.txt, keywords, schema, privacy policy, terms of service, page speed, or
  search ranking for WorldNewz.
compatibility:
  frontend:
    runtime: React 18+ · Vite 5+ · TypeScript 5+
    packages:
      - react-helmet-async@2+
      - vite-plugin-sitemap
      - vite-ssg (optional SSG)
  backend:
    runtime: ASP.NET Core 8 (.NET 8)
    packages:
      - AspNetCore.SEOHelper
      - ParkSquare.AspNetCore.Sitemap
      - RobotsTxtCore
      - Hangfire (daily keyword automation)
      - Microsoft.EntityFrameworkCore.SqlServer
  services:
    - Claude API (keyword + content generation)
    - Google Search Console API (performance data)
    - Anthropic API (SEO scoring + audit)
---

# WorldNewz SEO Skill Agent

Complete SEO automation system for **https://world-newz.vercel.app** covering
every dimension of search optimization — technical, on-page, content, legal pages,
and daily keyword automation — across both the React+Vite frontend and ASP.NET Core
backend.

---

## Table of Contents

1. [SEO Architecture Overview](#1-seo-architecture-overview)
2. [Current Site Audit — WorldNewz Baseline](#2-current-site-audit)
3. [Frontend SEO — React + Vite + TypeScript](#3-frontend-seo)
   - 3.1 Install & Setup
   - 3.2 Global SEO Provider
   - 3.3 Per-Page Dynamic Meta Tags
   - 3.4 Open Graph + Twitter Cards
   - 3.5 JSON-LD Structured Data (Schema.org)
   - 3.6 Canonical Tags
   - 3.7 Core Web Vitals & Performance
   - 3.8 Vite Config — Sitemap + Build Optimizations
4. [Backend SEO — ASP.NET Core](#4-backend-seo)
   - 4.1 NuGet Packages
   - 4.2 Dynamic Sitemap.xml Endpoint
   - 4.3 Robots.txt Middleware
   - 4.4 SEO API Endpoints (meta, keywords)
   - 4.5 Hangfire — Daily Keyword Automation
   - 4.6 Google Search Console Integration
5. [Automated Daily Keyword Pipeline](#5-daily-keyword-pipeline)
6. [Privacy Policy Page](#6-privacy-policy)
7. [Terms & Conditions Page](#7-terms-and-conditions)
8. [JSON-LD Schema Templates](#8-json-ld-schema-templates)
9. [robots.txt Specification](#9-robotstxt)
10. [SEO Audit Checklist](#10-seo-audit-checklist)
11. [E-E-A-T & GEO Optimization](#11-eeat-and-geo)
12. [Google Search Console Setup](#12-google-search-console)
13. [Monitoring & Reporting](#13-monitoring-and-reporting)

---

## 1. SEO Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    WORLDNEWZ SEO SYSTEM                              │
│                                                                      │
│  FRONTEND (React + Vite + TypeScript)                                │
│  ├── react-helmet-async  → Dynamic <head> per route                  │
│  ├── SEOProvider         → Global defaults + page overrides          │
│  ├── JSON-LD Components  → NewsArticle, WebSite, BreadcrumbList      │
│  ├── vite-plugin-sitemap → Build-time sitemap.xml                    │
│  └── PerformanceWrapper  → Lazy load, WebP, LCP optimization         │
│                                                                      │
│  BACKEND (ASP.NET Core 8)                                            │
│  ├── /sitemap.xml        → Dynamic XML from DB (news articles)       │
│  ├── /robots.txt         → ParkSquare middleware                     │
│  ├── /api/seo/keywords   → Daily AI-generated keywords (JSON)        │
│  ├── /api/seo/meta/:slug → Per-article meta (title/desc/og)          │
│  ├── /privacy-policy     → Legal page with SEO meta                  │
│  ├── /terms              → Legal page with SEO meta                  │
│  └── Hangfire Jobs       → Daily keyword refresh + sitemap ping      │
│                                                                      │
│  AUTOMATION                                                          │
│  ├── Claude API          → Keyword generation + meta writing         │
│  ├── GSC API             → Performance monitoring                    │
│  └── Sitemap Ping        → Notify Google/Bing on content update      │
└──────────────────────────────────────────────────────────────────────┘
```

### Key SEO Challenges for WorldNewz (SPA)

WorldNewz is a **React SPA** — client-side rendered by default. Search engine
crawlers see minimal HTML before JS executes. This skill addresses that with:

1. **react-helmet-async** injecting meta tags that modern crawlers (Googlebot) DO read
2. **ASP.NET Core** serving `sitemap.xml`, `robots.txt`, and pre-rendered meta via API
3. **JSON-LD** structured data (parsed by crawlers without JS execution)
4. **Optional SSR/SSG** via `vite-ssg` for critical pages

---

## 2. Current Site Audit — WorldNewz Baseline

Based on the live site at `https://world-newz.vercel.app`:

| SEO Signal          | Current State              | Priority Fix       |
|---------------------|----------------------------|--------------------|
| Title tag           | ✅ Dynamic per-page        | Complete           |
| Meta description    | ✅ Dynamic per-page        | Complete           |
| Keywords meta       | ✅ Dynamic daily AI-driven  | Complete           |
| OG tags             | ✅ Complete with 1200x630px og-image.png and time tags | Complete |
| Twitter Cards       | ✅ Complete with summary_large_image and site tags | Complete |
| JSON-LD schema      | ✅ NewsArticle, WebSite & Breadcrumbs valid | Complete |
| Sitemap.xml         | ✅ Dynamic from backend API | Complete           |
| news-sitemap.xml    | ✅ Dynamic for last-48hr articles | Complete     |
| robots.txt          | ✅ Complete with all sitemaps registered | Complete |
| Canonical tag       | ✅ Automated per route     | Complete           |
| Core Web Vitals     | ✅ LCP optimized via fetchpriority="high" | Complete |
| Privacy Policy      | ✅ Live and footer linked  | Complete           |
| Terms & Conditions  | ✅ Live and footer linked  | Complete           |
| RSS Feed            | ✅ Live at /rss/{feedType} and footer linked | Complete |
| hreflang            | ⚠️ Not needed (English only) | Add if multilingual |

---

## 3. Frontend SEO — React + Vite + TypeScript

### 3.1 Install & Setup

```bash
# Core SEO packages
npm install react-helmet-async

# Sitemap generation at build time
npm install -D vite-plugin-sitemap

# Optional: Static site generation for critical pages
npm install -D vite-ssg

# Performance
npm install -D @vitejs/plugin-react
```

### 3.2 Global SEO Provider

```typescript
// src/seo/SEOProvider.tsx
import { HelmetProvider } from 'react-helmet-async';
import { ReactNode } from 'react';

interface SEOProviderProps {
  children: ReactNode;
}

export const SEOProvider = ({ children }: SEOProviderProps) => (
  <HelmetProvider>{children}</HelmetProvider>
);
```

```typescript
// src/main.tsx
import { SEOProvider } from './seo/SEOProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SEOProvider>
      <App />
    </SEOProvider>
  </React.StrictMode>
);
```

### 3.3 SEO Component — Per-Page Dynamic Meta

```typescript
// src/seo/SEOMeta.tsx
import { Helmet } from 'react-helmet-async';

export interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  noIndex?: boolean;
}

const SITE_NAME  = 'WorldNewz';
const SITE_URL   = 'https://world-newz.vercel.app';
const DEFAULT_OG = 'https://worldnewz.onrender.com/favicon.svg';

const DEFAULTS: SEOMetaProps = {
  title:       'WorldNewz – Your World, Your News',
  description: 'Stay updated with the latest breaking news in sports, business, technology, health, entertainment and world events.',
  keywords:    ['news', 'breaking news', 'world news', 'latest headlines', 'WorldNewz'],
  ogType:      'website',
  ogImage:     DEFAULT_OG,
};

export const SEOMeta = (props: SEOMetaProps) => {
  const p         = { ...DEFAULTS, ...props };
  const fullTitle = p.title === DEFAULTS.title ? p.title : `${p.title} | ${SITE_NAME}`;
  const canonical = p.canonical ?? (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  return (
    <Helmet prioritizeSeoTags>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description"        content={p.description!} />
      <meta name="keywords"           content={p.keywords!.join(', ')} />
      <link rel="canonical"           href={canonical} />
      {p.noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={p.description!} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={p.ogType!} />
      <meta property="og:image"       content={p.ogImage!} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height"content="630" />
      <meta property="og:locale"      content="en_US" />

      {/* Twitter / X Cards */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@WorldNewz" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={p.description!} />
      <meta name="twitter:image"       content={p.ogImage!} />

      {/* Article-specific */}
      {p.ogType === 'article' && p.articlePublishedTime && (
        <meta property="article:published_time" content={p.articlePublishedTime} />
      )}
      {p.ogType === 'article' && p.articleModifiedTime && (
        <meta property="article:modified_time" content={p.articleModifiedTime} />
      )}
      {p.ogType === 'article' && p.articleSection && (
        <meta property="article:section" content={p.articleSection} />
      )}

      {/* Technical */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type"  content="text/html; charset=UTF-8" />
      <meta name="theme-color"        content="#1a1a2e" />
    </Helmet>
  );
};
```

### 3.4 Per-Page Usage

```typescript
// src/pages/HomePage.tsx
import { SEOMeta } from '../seo/SEOMeta';

export const HomePage = () => (
  <>
    <SEOMeta
      title="WorldNewz – Breaking News, Latest Headlines"
      description="WorldNewz delivers real-time breaking news in sports, business, technology, health and world events. Stay informed 24/7."
      keywords={['breaking news', 'latest news today', 'world headlines', 'news aggregator']}
      canonical="https://world-newz.vercel.app/"
    />
    {/* page content */}
  </>
);

// src/pages/CategoryPage.tsx
export const CategoryPage = ({ category }: { category: string }) => {
  const meta: Record<string, { title: string; description: string; keywords: string[] }> = {
    sports:        { title: 'Sports News',       description: 'Latest sports scores, transfers, and match results.',    keywords: ['sports news', 'football scores', 'match results']  },
    business:      { title: 'Business News',     description: 'Financial markets, mergers, and economic news.',         keywords: ['business news', 'stock market', 'economy']          },
    technology:    { title: 'Technology News',   description: 'AI, gadgets, cybersecurity and tech industry updates.',  keywords: ['tech news', 'AI news', 'gadgets', 'cybersecurity']   },
    health:        { title: 'Health News',       description: 'Medical research, public health, wellness and more.',    keywords: ['health news', 'medical research', 'wellness']        },
    world:         { title: 'World News',        description: 'Geopolitics, diplomacy and international events.',       keywords: ['world news', 'international news', 'geopolitics']    },
    entertainment: { title: 'Entertainment News',description: 'Movies, music, celebrities and pop culture.',            keywords: ['entertainment news', 'celebrity', 'movies', 'music'] },
    science:       { title: 'Science News',      description: 'Space, climate science and scientific discoveries.',     keywords: ['science news', 'space', 'climate', 'discoveries']    },
  };

  const m = meta[category.toLowerCase()] ?? meta['world'];

  return (
    <>
      <SEOMeta
        title={`${m.title} | WorldNewz`}
        description={m.description}
        keywords={m.keywords}
        canonical={`https://world-newz.vercel.app/category/${category.toLowerCase()}`}
        ogType="website"
      />
      {/* category content */}
    </>
  );
};

// src/pages/ArticlePage.tsx
export const ArticlePage = ({ article }: { article: Article }) => (
  <>
    <SEOMeta
      title={article.title}
      description={article.summary}
      keywords={article.tags}
      canonical={`https://world-newz.vercel.app/article/${article.slug}`}
      ogType="article"
      ogImage={article.imageUrl}
      articlePublishedTime={article.publishedAt}
      articleModifiedTime={article.updatedAt}
      articleSection={article.category}
    />
    <JSONLDNewsArticle article={article} />
    {/* article content */}
  </>
);
```

### 3.5 JSON-LD Structured Data Components

```typescript
// src/seo/JSONLDSchemas.tsx
import { Helmet } from 'react-helmet-async';

const SITE_URL  = 'https://world-newz.vercel.app';
const SITE_NAME = 'WorldNewz';
const LOGO_URL  = 'https://worldnewz.onrender.com/favicon.svg';

/* ── WebSite schema (inject in App root, once) ── */
export const JSONLDWebSite = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context":     "https://schema.org",
      "@type":        "WebSite",
      "name":         SITE_NAME,
      "url":          SITE_URL,
      "description":  "Breaking news in sports, business, technology, health, and world events.",
      "potentialAction": {
        "@type":       "SearchAction",
        "target":      `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name":  SITE_NAME,
        "logo": {
          "@type": "ImageObject",
          "url":   LOGO_URL
        }
      }
    })}</script>
  </Helmet>
);

/* ── NewsArticle schema (inject per article page) ── */
interface Article {
  title: string;
  summary: string;
  content: string;
  slug: string;
  imageUrl: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  author?: string;
  tags: string[];
}

export const JSONLDNewsArticle = ({ article }: { article: Article }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context":         "https://schema.org",
      "@type":            "NewsArticle",
      "headline":         article.title,
      "description":      article.summary,
      "image":            [article.imageUrl],
      "datePublished":    article.publishedAt,
      "dateModified":     article.updatedAt,
      "url":              `${SITE_URL}/article/${article.slug}`,
      "articleSection":   article.category,
      "keywords":         article.tags.join(', '),
      "inLanguage":       "en-US",
      "author": {
        "@type": "Organization",
        "name":  article.author ?? SITE_NAME
      },
      "publisher": {
        "@type": "Organization",
        "name":  SITE_NAME,
        "logo": { "@type": "ImageObject", "url": LOGO_URL }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id":   `${SITE_URL}/article/${article.slug}`
      }
    })}</script>
  </Helmet>
);

/* ── BreadcrumbList schema ── */
interface Crumb { name: string; url: string; }
export const JSONLDBreadcrumb = ({ crumbs }: { crumbs: Crumb[] }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type":    "BreadcrumbList",
      "itemListElement": crumbs.map((c, i) => ({
        "@type":    "ListItem",
        "position": i + 1,
        "name":     c.name,
        "item":     c.url
      }))
    })}</script>
  </Helmet>
);

/* ── FAQPage schema (for FAQ / Help page) ── */
interface FAQItem { question: string; answer: string; }
export const JSONLDFAQPage = ({ items }: { items: FAQItem[] }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type":    "FAQPage",
      "mainEntity": items.map(i => ({
        "@type":          "Question",
        "name":           i.question,
        "acceptedAnswer": { "@type": "Answer", "text": i.answer }
      }))
    })}</script>
  </Helmet>
);
```

### 3.6 Keyword Hook — Fetches Daily Keywords from Backend

```typescript
// src/seo/useKeywords.ts
import { useEffect, useState } from 'react';

interface KeywordData {
  category: string;
  primary:  string[];
  longtail: string[];
  trending: string[];
  updatedAt: string;
}

const API_BASE = 'https://worldnewz.onrender.com';

export const useKeywords = (category: string): KeywordData | null => {
  const [data, setData] = useState<KeywordData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/seo/keywords/${category}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, [category]);

  return data;
};
```

### 3.7 Vite Config — Sitemap + Build Optimizations

```typescript
// vite.config.ts
import { defineConfig }  from 'vite';
import react              from '@vitejs/plugin-react';
import sitemap            from 'vite-plugin-sitemap';

const SITE_URL   = 'https://world-newz.vercel.app';
const CATEGORIES = ['sports', 'business', 'technology', 'health', 'world', 'entertainment', 'science'];

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: SITE_URL,
      dynamicRoutes: [
        '/',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms',
        ...CATEGORIES.map(c => `/category/${c}`),
      ],
      // Dynamic article routes come from the backend sitemap
      // This covers static routes only
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          seo:    ['react-helmet-async'],
        }
      }
    },
    // Enable compression
    minify:     'terser',
    sourcemap:  false,
    chunkSizeWarningLimit: 600,
  },
});
```

### 3.8 public/robots.txt (Frontend Fallback)

```
# Served by Vercel (static fallback — dynamic version from ASP.NET backend)
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

Sitemap: https://worldnewz.onrender.com/sitemap.xml
Sitemap: https://world-newz.vercel.app/sitemap.xml
```

---

## 4. Backend SEO — ASP.NET Core

### 4.1 NuGet Packages

```xml
<ItemGroup>
  <PackageReference Include="AspNetCore.SEOHelper"            Version="1.*" />
  <PackageReference Include="ParkSquare.AspNetCore.Sitemap"   Version="8.*" />
  <PackageReference Include="RobotsTxtCore"                   Version="1.*" />
  <PackageReference Include="Hangfire.AspNetCore"             Version="1.8.*" />
  <PackageReference Include="Hangfire.SqlServer"              Version="1.8.*" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.*" />
  <PackageReference Include="Google.Apis.SearchConsole.v1"    Version="1.*" />
</ItemGroup>
```

### 4.2 Dynamic Sitemap.xml Endpoint

```csharp
// Controllers/SeoController.cs
[ApiController]
[Route("")]
public class SeoController : ControllerBase
{
    private readonly AppDbContext   _db;
    private readonly IConfiguration _cfg;

    public SeoController(AppDbContext db, IConfiguration cfg)
    {
        _db  = db;
        _cfg = cfg;
    }

    // GET /sitemap.xml
    [HttpGet("sitemap.xml")]
    [ResponseCache(Duration = 3600, VaryByHeader = "Accept-Encoding")]
    public async Task<IActionResult> Sitemap()
    {
        var siteUrl  = _cfg["Site:BaseUrl"]!; // https://world-newz.vercel.app
        var articles = await _db.Articles
            .Where(a => a.IsPublished)
            .OrderByDescending(a => a.PublishedAt)
            .Select(a => new { a.Slug, a.Category, a.PublishedAt, a.UpdatedAt })
            .Take(50000) // Sitemap index limit
            .ToListAsync();

        var categories = new[] { "sports","business","technology","health","world","entertainment","science" };

        var sb = new System.Text.StringBuilder();
        sb.AppendLine(@"<?xml version=""1.0"" encoding=""UTF-8""?>");
        sb.AppendLine(@"<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9""");
        sb.AppendLine(@"        xmlns:news=""http://www.google.com/schemas/sitemap-news/0.9""");
        sb.AppendLine(@"        xmlns:image=""http://www.google.com/schemas/sitemap-image/1.1"">");

        // Static pages
        var staticPages = new[]
        {
            ("",                0.9, "daily"),
            ("about",           0.5, "monthly"),
            ("contact",         0.5, "monthly"),
            ("privacy-policy",  0.3, "yearly"),
            ("terms",           0.3, "yearly"),
        };

        foreach (var (path, priority, freq) in staticPages)
        {
            var url = string.IsNullOrEmpty(path) ? siteUrl : $"{siteUrl}/{path}";
            sb.AppendLine($"""
              <url>
                <loc>{url}</loc>
                <changefreq>{freq}</changefreq>
                <priority>{priority:F1}</priority>
                <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>
              </url>
            """);
        }

        // Category pages
        foreach (var cat in categories)
        {
            sb.AppendLine($"""
              <url>
                <loc>{siteUrl}/category/{cat}</loc>
                <changefreq>hourly</changefreq>
                <priority>0.8</priority>
                <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>
              </url>
            """);
        }

        // Article pages (with Google News sitemap extension)
        foreach (var a in articles)
        {
            var articleUrl = $"{siteUrl}/article/{a.Slug}";
            var pubDate    = a.PublishedAt.ToString("yyyy-MM-ddTHH:mm:sszzz");
            var modDate    = (a.UpdatedAt ?? a.PublishedAt).ToString("yyyy-MM-dd");

            sb.AppendLine($"""
              <url>
                <loc>{articleUrl}</loc>
                <lastmod>{modDate}</lastmod>
                <changefreq>never</changefreq>
                <priority>0.7</priority>
                <news:news>
                  <news:publication>
                    <news:name>WorldNewz</news:name>
                    <news:language>en</news:language>
                  </news:publication>
                  <news:publication_date>{pubDate}</news:publication_date>
                  <news:title>{System.Security.SecurityElement.Escape(a.Slug.Replace('-', ' '))}</news:title>
                </news:news>
              </url>
            """);
        }

        sb.AppendLine("</urlset>");
        return Content(sb.ToString(), "application/xml", System.Text.Encoding.UTF8);
    }

    // GET /robots.txt  (also handled by RobotsTxtCore middleware)
    [HttpGet("robots.txt")]
    public IActionResult RobotsTxt()
    {
        var siteUrl = _cfg["Site:BaseUrl"]!;
        var content = $"""
            User-agent: *
            Allow: /
            Disallow: /api/admin/
            Disallow: /hangfire/
            Disallow: /swagger/
            Crawl-delay: 1

            User-agent: Googlebot
            Allow: /
            Crawl-delay: 0

            User-agent: Bingbot
            Allow: /
            Crawl-delay: 1

            Sitemap: {siteUrl}/sitemap.xml
            Sitemap: https://worldnewz.onrender.com/sitemap.xml
            """;
        return Content(content, "text/plain");
    }
}
```

### 4.3 Program.cs — SEO Middleware Registration

```csharp
// Program.cs (relevant SEO sections)
var builder = WebApplication.CreateBuilder(args);

// Hangfire + EF (see Lead Generator skill for full setup)
builder.Services.AddDbContext<AppDbContext>(...);
builder.Services.AddHangfire(...);
builder.Services.AddHangfireServer();

// Caching (for sitemap performance)
builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();

builder.Services.AddHttpClient();
builder.Services.AddScoped<SeoKeywordService>();
builder.Services.AddScoped<SitemapPingService>();
builder.Services.AddControllers();

var app = builder.Build();

// SEO middleware — ORDER MATTERS
app.UseResponseCaching();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire");
app.MapControllers();

// Register Hangfire recurring SEO jobs
RecurringJob.AddOrUpdate<SeoKeywordService>(
    "worldnewz-daily-keywords",
    svc => svc.RefreshAllKeywordsAsync(),
    "0 2 * * *"); // 2 AM UTC daily

RecurringJob.AddOrUpdate<SitemapPingService>(
    "worldnewz-sitemap-ping",
    svc => svc.PingSearchEnginesAsync(),
    "0 */6 * * *"); // Every 6 hours

app.Run();
```

### 4.4 SEO Meta API Endpoint

```csharp
// Controllers/SeoMetaController.cs
[ApiController]
[Route("api/seo")]
public class SeoMetaController : ControllerBase
{
    private readonly AppDbContext    _db;
    private readonly SeoKeywordService _keywords;
    private readonly IMemoryCache    _cache;

    public SeoMetaController(AppDbContext db, SeoKeywordService kw, IMemoryCache cache)
    {
        _db = db; _keywords = kw; _cache = cache;
    }

    // GET /api/seo/meta/{slug} — per-article meta for SSR injection
    [HttpGet("meta/{slug}")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> GetMeta(string slug)
    {
        var article = await _db.Articles
            .FirstOrDefaultAsync(a => a.Slug == slug && a.IsPublished);

        if (article == null) return NotFound();

        return Ok(new
        {
            title       = $"{article.Title} | WorldNewz",
            description = article.Summary,
            keywords    = article.Tags,
            ogImage     = article.ImageUrl,
            canonical   = $"https://world-newz.vercel.app/article/{slug}",
            publishedAt = article.PublishedAt,
            updatedAt   = article.UpdatedAt,
            category    = article.Category
        });
    }

    // GET /api/seo/keywords/{category} — daily keywords for frontend
    [HttpGet("keywords/{category}")]
    [ResponseCache(Duration = 3600)]
    public async Task<IActionResult> GetKeywords(string category)
    {
        var key      = $"keywords_{category}";
        if (_cache.TryGetValue(key, out var cached)) return Ok(cached);

        var keywords = await _db.SeoKeywords
            .Where(k => k.Category == category && k.Date == DateTime.UtcNow.Date)
            .FirstOrDefaultAsync();

        if (keywords == null)
            keywords = await _keywords.GenerateKeywordsAsync(category);

        _cache.Set(key, keywords, TimeSpan.FromHours(1));
        return Ok(keywords);
    }

    // GET /api/seo/keywords/all — all categories for homepage
    [HttpGet("keywords/all")]
    [ResponseCache(Duration = 3600)]
    public async Task<IActionResult> GetAllKeywords()
    {
        var today = DateTime.UtcNow.Date;
        var all   = await _db.SeoKeywords
            .Where(k => k.Date == today)
            .ToListAsync();
        return Ok(all);
    }
}
```

---

## 5. Daily Keyword Pipeline

### Data Model

```csharp
// Models/SeoKeyword.cs
public class SeoKeyword
{
    public int      Id        { get; set; }
    public string   Category  { get; set; } = string.Empty; // "sports","technology", etc.
    public string   Primary   { get; set; } = "[]";  // JSON array
    public string   Longtail  { get; set; } = "[]";  // JSON array
    public string   Trending  { get; set; } = "[]";  // JSON array
    public string   MetaDesc  { get; set; } = string.Empty; // AI-written meta description
    public DateTime Date      { get; set; } = DateTime.UtcNow.Date;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### Claude-Powered Keyword Generation Service

```csharp
// Services/SeoKeywordService.cs
public class SeoKeywordService
{
    private readonly HttpClient    _http;
    private readonly IConfiguration _cfg;
    private readonly AppDbContext  _db;
    private readonly ILogger<SeoKeywordService> _log;

    private static readonly string[] CATEGORIES =
        { "sports","business","technology","health","world","entertainment","science" };

    public SeoKeywordService(IHttpClientFactory factory, IConfiguration cfg,
        AppDbContext db, ILogger<SeoKeywordService> log)
    {
        _http = factory.CreateClient();
        _http.DefaultRequestHeaders.Add("x-api-key", cfg["Claude:ApiKey"]);
        _http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _cfg = cfg; _db = db; _log = log;
    }

    // Called by Hangfire at 2 AM UTC daily
    public async Task RefreshAllKeywordsAsync()
    {
        foreach (var category in CATEGORIES)
        {
            try
            {
                await GenerateKeywordsAsync(category);
                await Task.Delay(1000); // Rate limit courtesy
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Failed keyword generation for {Category}", category);
            }
        }
        _log.LogInformation("Daily keyword refresh complete for {Count} categories", CATEGORIES.Length);
    }

    public async Task<SeoKeyword> GenerateKeywordsAsync(string category)
    {
        var today = DateTime.UtcNow.Date;

        // Skip if already generated today
        var existing = await _db.SeoKeywords
            .FirstOrDefaultAsync(k => k.Category == category && k.Date == today);
        if (existing != null) return existing;

        var systemPrompt = """
            You are an expert SEO specialist for a news aggregator website.
            Always respond ONLY with valid JSON. No preamble, no markdown code fences.
            """;

        var userPrompt = $"""
            Generate daily SEO keywords for the WorldNewz news website (world-newz.vercel.app)
            for the '{category}' news category. Today is {DateTime.UtcNow:yyyy-MM-dd}.

            Return a JSON object with exactly this structure:
            {{
              "primary":   ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
              "longtail":  ["long tail phrase 1", "long tail phrase 2", "long tail phrase 3"],
              "trending":  ["trending topic 1", "trending topic 2", "trending topic 3"],
              "metaDesc":  "A compelling 150-160 character meta description for the {category} news category page on WorldNewz, including the most important primary keyword naturally."
            }}

            Rules:
            - Primary: 5 high-volume, commercially relevant keywords for {category} news
            - Long-tail: 3 specific phrases (4-6 words) with clear search intent
            - Trending: 3 currently newsworthy topics in {category} (infer from today's date)
            - Meta desc: 150-160 chars, include WorldNewz brand, action-oriented
            - Keywords must be varied, not repetitive
            """;

        var payload = new
        {
            model      = _cfg["Claude:Model"],
            max_tokens = 600,
            system     = systemPrompt,
            messages   = new[] { new { role = "user", content = userPrompt } }
        };

        var response = await _http.PostAsJsonAsync("https://api.anthropic.com/v1/messages", payload);
        var data     = await response.Content.ReadFromJsonAsync<ClaudeResponse>();
        var rawJson  = data?.Content?.FirstOrDefault()?.Text?.Trim() ?? "{}";

        // Strip any accidental code fences
        rawJson = rawJson.Replace("```json", "").Replace("```", "").Trim();

        var parsed   = System.Text.Json.JsonDocument.Parse(rawJson).RootElement;

        var record = new SeoKeyword
        {
            Category = category,
            Date     = today,
            Primary  = parsed.GetProperty("primary").GetRawText(),
            Longtail = parsed.GetProperty("longtail").GetRawText(),
            Trending = parsed.GetProperty("trending").GetRawText(),
            MetaDesc = parsed.GetProperty("metaDesc").GetString() ?? string.Empty
        };

        _db.SeoKeywords.Add(record);
        await _db.SaveChangesAsync();

        _log.LogInformation("Keywords generated for {Category} on {Date}", category, today);
        return record;
    }
}
```

### Sitemap Ping Service

```csharp
// Services/SitemapPingService.cs
public class SitemapPingService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _cfg;
    private readonly ILogger<SitemapPingService> _log;

    public SitemapPingService(IHttpClientFactory factory, IConfiguration cfg,
        ILogger<SitemapPingService> log)
    {
        _http = factory.CreateClient(); _cfg = cfg; _log = log;
    }

    public async Task PingSearchEnginesAsync()
    {
        var sitemapUrl  = System.Uri.EscapeDataString(
            $"{_cfg["Site:BackendUrl"]}/sitemap.xml");

        var pings = new[]
        {
            $"https://www.google.com/ping?sitemap={sitemapUrl}",
            $"https://www.bing.com/ping?sitemap={sitemapUrl}",
        };

        foreach (var ping in pings)
        {
            try
            {
                var res = await _http.GetAsync(ping);
                _log.LogInformation("Sitemap ping {Url} → {Status}", ping, res.StatusCode);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Sitemap ping failed for {Url}", ping);
            }
        }
    }
}
```

---

## 6. Privacy Policy

### Frontend Component

```typescript
// src/pages/PrivacyPolicyPage.tsx
import { SEOMeta }      from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';

const LAST_UPDATED = '2025-01-01';
const SITE_NAME    = 'WorldNewz';
const SITE_URL     = 'https://world-newz.vercel.app';
const CONTACT_EMAIL= 'privacy@worldnewz.com';

export const PrivacyPolicyPage = () => (
  <>
    <SEOMeta
      title="Privacy Policy | WorldNewz"
      description="WorldNewz Privacy Policy — how we collect, use, and protect your data when you use our news aggregation service."
      canonical={`${SITE_URL}/privacy-policy`}
      noIndex={false}
    />
    <JSONLDBreadcrumb crumbs={[
      { name: 'Home', url: SITE_URL },
      { name: 'Privacy Policy', url: `${SITE_URL}/privacy-policy` }
    ]} />

    <main className="legal-page" itemScope itemType="https://schema.org/WebPage">
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> {LAST_UPDATED}</p>
      <p><strong>Effective Date:</strong> {LAST_UPDATED}</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to {SITE_NAME} ("we," "our," or "us"). We operate the news aggregation platform
          at <a href={SITE_URL}>{SITE_URL}</a> ("Service"). This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you use our Service.
          Please read this Privacy Policy carefully. By using the Service, you consent to
          the practices described herein.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide</h3>
        <ul>
          <li>Email address (if you subscribe to newsletters)</li>
          <li>Name (if you register for an account)</li>
          <li>Communication data (if you contact us)</li>
        </ul>
        <h3>2.2 Automatically Collected Information</h3>
        <ul>
          <li>IP address and approximate geolocation</li>
          <li>Browser type, version, and language</li>
          <li>Operating system and device information</li>
          <li>Pages visited, time spent, referring URLs</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
        <h3>2.3 Third-Party Data</h3>
        <p>
          We aggregate news content from third-party sources. We do not control and are not
          responsible for the privacy practices of those third-party news sources.
        </p>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Personalize your news experience based on reading preferences</li>
          <li>Send newsletters and updates (with your consent)</li>
          <li>Analyze usage patterns to improve performance and SEO</li>
          <li>Detect and prevent fraud or abuse</li>
          <li>Comply with legal obligations</li>
          <li>Respond to your requests and support inquiries</li>
        </ul>
      </section>

      <section>
        <h2>4. Cookies and Tracking Technologies</h2>
        <p>We use cookies and similar technologies for:</p>
        <ul>
          <li><strong>Essential cookies:</strong> Required for the Service to function</li>
          <li><strong>Analytics cookies:</strong> Google Analytics (anonymized IP) to understand usage</li>
          <li><strong>Preference cookies:</strong> To remember your category preferences</li>
          <li><strong>Marketing cookies:</strong> Only if you consent, for personalized content</li>
        </ul>
        <p>
          You may control cookies via your browser settings. Disabling certain cookies may
          affect Service functionality. We support Do Not Track (DNT) browser signals.
        </p>
      </section>

      <section>
        <h2>5. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share data with:</p>
        <ul>
          <li><strong>Service providers:</strong> Hosting (Vercel), analytics, email services</li>
          <li><strong>Legal authorities:</strong> When required by law or court order</li>
          <li><strong>Business transfers:</strong> In the event of a merger or acquisition</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain personal data for as long as necessary to provide the Service and comply
          with legal obligations. Analytics data is retained for 26 months. You may request
          deletion of your data at any time.
        </p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate personal data</li>
          <li>Request deletion of your personal data ("right to be forgotten")</li>
          <li>Restrict or object to processing of your data</li>
          <li>Data portability (receive your data in a structured format)</li>
          <li>Withdraw consent at any time (where processing is based on consent)</li>
          <li>Lodge a complaint with a supervisory authority (GDPR / EU users)</li>
        </ul>
        <p>To exercise these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>8. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your
          own. We ensure appropriate safeguards are in place for such transfers, including
          Standard Contractual Clauses where required by the GDPR.
        </p>
      </section>

      <section>
        <h2>9. Children's Privacy</h2>
        <p>
          The Service is not directed to children under 13 years of age (or 16 in the EU).
          We do not knowingly collect personal information from children. If you believe we
          have collected data from a child, please contact us immediately.
        </p>
      </section>

      <section>
        <h2>10. Security</h2>
        <p>
          We implement industry-standard security measures including HTTPS encryption,
          access controls, and regular security reviews. However, no method of transmission
          over the internet is 100% secure.
        </p>
      </section>

      <section>
        <h2>11. Third-Party Links</h2>
        <p>
          Our Service contains links to third-party news sources. We are not responsible
          for the privacy practices or content of those sites. We encourage you to review
          their privacy policies.
        </p>
      </section>

      <section>
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of material
          changes by posting the new policy on this page and updating the "Last Updated"
          date. Your continued use of the Service after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>13. Contact Us</h2>
        <address>
          <strong>{SITE_NAME}</strong><br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
          Website: <a href={SITE_URL}>{SITE_URL}</a>
        </address>
      </section>
    </main>
  </>
);
```

---

## 7. Terms & Conditions

```typescript
// src/pages/TermsPage.tsx
import { SEOMeta }         from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';

const LAST_UPDATED  = '2025-01-01';
const SITE_NAME     = 'WorldNewz';
const SITE_URL      = 'https://world-newz.vercel.app';
const CONTACT_EMAIL = 'legal@worldnewz.com';

export const TermsPage = () => (
  <>
    <SEOMeta
      title="Terms & Conditions | WorldNewz"
      description="WorldNewz Terms and Conditions — the rules and guidelines governing your use of the WorldNewz news aggregation platform."
      canonical={`${SITE_URL}/terms`}
    />
    <JSONLDBreadcrumb crumbs={[
      { name: 'Home',             url: SITE_URL },
      { name: 'Terms & Conditions', url: `${SITE_URL}/terms` }
    ]} />

    <main className="legal-page">
      <h1>Terms &amp; Conditions</h1>
      <p><strong>Last Updated:</strong> {LAST_UPDATED}</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {SITE_NAME} at <a href={SITE_URL}>{SITE_URL}</a> ("Service"),
          you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with
          any part, you may not access the Service. These Terms apply to all visitors, users,
          and others who access or use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          {SITE_NAME} is a news aggregation platform that collects and displays news content
          from various third-party sources. We do not create original news content and are
          not responsible for the accuracy, completeness, or timeliness of third-party content.
        </p>
      </section>

      <section>
        <h2>3. Intellectual Property</h2>
        <h3>3.1 Our Content</h3>
        <p>
          The {SITE_NAME} platform, including its design, logos, and original code, is owned by
          {SITE_NAME} and protected by intellectual property laws.
        </p>
        <h3>3.2 Third-Party Content</h3>
        <p>
          News content displayed on the Service belongs to the respective publishers and
          original sources. {SITE_NAME} aggregates this content under fair use principles and
          provides proper attribution and links to original sources.
        </p>
        <h3>3.3 User Content</h3>
        <p>
          By submitting any content (comments, feedback), you grant {SITE_NAME} a non-exclusive,
          royalty-free license to use, reproduce, and display such content in connection with
          the Service.
        </p>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Scrape, crawl, or automatically extract data without written permission</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Transmit malware, viruses, or harmful code</li>
          <li>Use the Service to spam, harass, or harm others</li>
          <li>Impersonate {SITE_NAME} or any other person or entity</li>
          <li>Violate any applicable local, national, or international law</li>
          <li>Interfere with the proper functioning of the Service</li>
        </ul>
      </section>

      <section>
        <h2>5. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. {SITE_NAME.toUpperCase()} DOES NOT
          WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, {SITE_NAME.toUpperCase()} SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING
          FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY
          OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED $100 USD.
        </p>
      </section>

      <section>
        <h2>7. Third-Party Links and Content</h2>
        <p>
          The Service contains links to third-party websites and displays third-party news
          content. We have no control over and assume no responsibility for the content,
          privacy policies, or practices of any third-party sites or services.
        </p>
      </section>

      <section>
        <h2>8. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless {SITE_NAME} and its officers,
          directors, employees, and agents from any claims, liabilities, damages, losses,
          or expenses (including attorneys' fees) arising from your use of the Service or
          your violation of these Terms.
        </p>
      </section>

      <section>
        <h2>9. Privacy</h2>
        <p>
          Your use of the Service is also governed by our{' '}
          <a href={`${SITE_URL}/privacy-policy`}>Privacy Policy</a>, which is incorporated
          into these Terms by reference.
        </p>
      </section>

      <section>
        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of
          the jurisdiction in which {SITE_NAME} operates, without regard to its conflict of
          law provisions. Any disputes shall be resolved through binding arbitration.
        </p>
      </section>

      <section>
        <h2>11. Modifications to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of
          significant changes by updating the "Last Updated" date. Your continued use of
          the Service constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>12. Termination</h2>
        <p>
          We may terminate or suspend access to the Service immediately, without prior
          notice, for any breach of these Terms. Upon termination, your right to use the
          Service will cease immediately.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <address>
          <strong>{SITE_NAME} Legal</strong><br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
          Website: <a href={SITE_URL}>{SITE_URL}</a>
        </address>
      </section>
    </main>
  </>
);
```

---

## 8. JSON-LD Schema Templates

Ready-to-paste schemas for all WorldNewz page types:

### WebSite (Homepage — inject once in `App.tsx`)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "WorldNewz",
  "url": "https://world-newz.vercel.app",
  "description": "Breaking news in sports, business, technology, health, and world events.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://world-newz.vercel.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "WorldNewz",
    "logo": { "@type": "ImageObject", "url": "https://worldnewz.onrender.com/favicon.svg" }
  }
}
```

### NewsArticle (Article pages)

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Article Title Here",
  "description": "Article summary 150-160 chars",
  "image": ["https://worldnewz.onrender.com/images/article-slug.jpg"],
  "datePublished": "2025-05-10T08:00:00+00:00",
  "dateModified": "2025-05-10T10:00:00+00:00",
  "url": "https://world-newz.vercel.app/article/article-slug",
  "articleSection": "Technology",
  "keywords": "keyword1, keyword2, keyword3",
  "inLanguage": "en-US",
  "author": { "@type": "Organization", "name": "WorldNewz" },
  "publisher": {
    "@type": "Organization",
    "name": "WorldNewz",
    "logo": { "@type": "ImageObject", "url": "https://worldnewz.onrender.com/favicon.svg" }
  }
}
```

### ItemList (Category pages — for Google Discover)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Technology News — WorldNewz",
  "description": "Latest technology news and updates",
  "url": "https://world-newz.vercel.app/category/technology",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://world-newz.vercel.app/article/article-slug-1",
      "name": "Article Title 1"
    }
  ]
}
```

---

## 9. robots.txt

### Final robots.txt (served by ASP.NET Core at /robots.txt)

```
User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /hangfire/
Disallow: /swagger/
Disallow: /dashboard/
Crawl-delay: 1

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Googlebot-News
Allow: /
Allow: /article/
Allow: /category/
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: GPTBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://world-newz.vercel.app/sitemap.xml
Sitemap: https://worldnewz.onrender.com/sitemap.xml
```

---

## 10. SEO Audit Checklist

Run this checklist on every deploy. Score each item 0/1.

### Technical SEO (Max 30 points)

| Check | Pass | Notes |
|---|---|---|
| HTTPS everywhere | ✅ | Vercel enforces HTTPS |
| sitemap.xml accessible | ☐ | GET /sitemap.xml returns 200 |
| robots.txt accessible | ☐ | GET /robots.txt returns 200 |
| No 404s on main routes | ☐ | Test all category + article routes |
| Canonical tag on every page | ☐ | Verify via `<link rel="canonical">` |
| No duplicate title tags | ☐ | Each page has unique title |
| No duplicate meta descriptions | ☐ | Each page has unique description |
| Titles 50–60 chars | ☐ | Check via Screaming Frog or GSC |
| Descriptions 150–160 chars | ☐ | Automated via Claude keyword service |
| Mobile-friendly | ☐ | Google Mobile-Friendly Test |
| Core Web Vitals — LCP < 2.5s | ☐ | PageSpeed Insights |
| Core Web Vitals — CLS < 0.1 | ☐ | PageSpeed Insights |
| Core Web Vitals — INP < 200ms | ☐ | PageSpeed Insights |
| JSON-LD valid (WebSite) | ☐ | schema.org validator |
| JSON-LD valid (NewsArticle) | ☐ | Rich Results Test |
| Open Graph tags present | ☐ | og:title, og:desc, og:image, og:url |
| Twitter Card tags present | ☐ | twitter:card, twitter:title, etc. |
| robots meta (noindex on legal pages: none) | ☐ | Legal pages should be indexed |
| Sitemap submitted to GSC | ☐ | One-time setup |
| Sitemap submitted to Bing | ☐ | One-time setup |
| IndexNow ping on new content | ☐ | Optional: add Hangfire job |
| hreflang (if multilingual) | N/A | Single language for now |
| Structured data — BreadcrumbList | ☐ | On all sub-pages |
| Images have alt text | ☐ | All news images |
| Images use WebP | ☐ | Build-time conversion |
| Lazy loading images | ☐ | `loading="lazy"` attribute |
| Pagination rel prev/next | ☐ | If paginated news feeds |
| Favicon present | ✅ | Already in site |
| Theme color meta | ☐ | `#1a1a2e` |
| Privacy Policy linked in footer | ☐ | Required for GDPR |

### Content SEO (Max 20 points)

| Check | Pass | Notes |
|---|---|---|
| Daily keywords refreshed | ☐ | Hangfire job at 2 AM UTC |
| Category pages have unique H1 | ☐ | Not just "Technology" — full phrase |
| Article pages have H1 = headline | ☐ | Match schema headline |
| Keyword in first 100 words | ☐ | For category + article pages |
| Internal links between articles | ☐ | Related articles widget |
| E-E-A-T signals present | ☐ | Author, publisher, date visible |
| News freshness signals | ☐ | Publish date visible, schema datePublished |
| FAQPage schema on FAQ | ☐ | If FAQ section exists |
| Google News inclusion | ☐ | Submit to Google News Publisher Center |

---

## 11. E-E-A-T and GEO Optimization

**E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) per Google's
September 2025 Quality Rater Guidelines:

```typescript
// Add to article pages — Publisher info block
const PublisherBlock = ({ article }: { article: Article }) => (
  <div className="publisher-info" itemScope itemType="https://schema.org/NewsArticle">
    <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
      <span itemProp="name">WorldNewz</span>
    </span>
    <time itemProp="datePublished" dateTime={article.publishedAt}>
      {new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })}
    </time>
    <span>Source: <a href={article.sourceUrl} rel="nofollow">{article.sourceName}</a></span>
  </div>
);
```

**GEO (Generative Engine Optimization)** — for AI search visibility (ChatGPT, Perplexity, Gemini):

```typescript
// Add FAQ section to category pages — optimizes for AI Overviews
const CategoryFAQ = ({ category }: { category: string }) => {
  const faqs: Record<string, FAQItem[]> = {
    technology: [
      { question: "What are today's top technology news stories?",
        answer:   "WorldNewz aggregates the latest tech news from leading sources including AI breakthroughs, product launches, and cybersecurity updates." },
      { question: "Where can I find the latest AI news?",
        answer:   "WorldNewz covers AI and machine learning news daily at world-newz.vercel.app/category/technology." }
    ],
    // ... other categories
  };

  return <JSONLDFAQPage items={faqs[category] ?? []} />;
};
```

---

## 12. Google Search Console Setup

### One-time setup steps:

```
1. Go to https://search.google.com/search-console/
2. Add property: "https://world-newz.vercel.app"
3. Verify via DNS TXT record or HTML file on Vercel
4. Submit sitemaps:
   - https://worldnewz.onrender.com/sitemap.xml
   - https://world-newz.vercel.app/sitemap.xml
5. Enable email alerts for coverage issues
6. Request indexing for key pages via URL Inspection
```

### GSC Performance API (optional — pulls real keyword data)

```csharp
// Services/GSCService.cs — Fetch actual search queries for keyword research
// Requires: Google.Apis.SearchConsole.v1 NuGet package
// Setup: Google Cloud Console → Enable Search Console API → Service Account JSON

public class GSCService
{
    // Returns top 100 queries for the site in last 28 days
    public async Task<List<string>> GetTopQueriesAsync()
    {
        // Authenticate with service account, call SearchAnalytics.Query
        // Returns real search queries users use to find WorldNewz
        // Feed this data back into keyword generation prompt for Claude
        throw new NotImplementedException("See Google Search Console API docs");
    }
}
```

---

## 13. Monitoring & Reporting

### Daily SEO Health Check (Hangfire Job — 6 AM UTC)

```csharp
// Jobs/SeoHealthCheckJob.cs
public class SeoHealthCheckJob
{
    private readonly HttpClient _http;
    private readonly ILogger<SeoHealthCheckJob> _log;

    public async Task RunAsync()
    {
        var checks = new Dictionary<string, string>
        {
            ["sitemap"]       = "https://worldnewz.onrender.com/sitemap.xml",
            ["robots"]        = "https://worldnewz.onrender.com/robots.txt",
            ["homepage"]      = "https://world-newz.vercel.app/",
            ["keywords-api"]  = "https://worldnewz.onrender.com/api/seo/keywords/technology",
        };

        foreach (var (name, url) in checks)
        {
            var res = await _http.GetAsync(url);
            _log.LogInformation("SEO Health [{Name}] {Url} → {Status}",
                name, url, (int)res.StatusCode);
        }
    }
}
```

### CRON Schedule Summary

| Job                   | Schedule         | Purpose                                  |
|-----------------------|------------------|------------------------------------------|
| `daily-keywords`      | `0 2 * * *`      | AI keyword refresh for all 7 categories  |
| `sitemap-ping`        | `0 */6 * * *`    | Notify Google + Bing of new content      |
| `seo-health-check`    | `0 6 * * *`      | Verify all SEO endpoints are live        |
| `gsc-performance`     | `0 8 * * 1`      | Weekly: pull GSC query data (Mondays)    |
| `sitemap-rebuild`     | `*/30 * * * *`   | Rebuild sitemap XML cache every 30 min   |

## 14. Advanced SEO, Performance & Monetization Guidelines

Strategic implementations and warnings to maximize search engine authority and page load performance:

### 14.1 Twitter Card & Open Graph Integration
Open Graph and Twitter Cards must be present on every page, with dynamic updates for article views:
- **twitter:card**: Should use `summary_large_image` to render a wide visual link.
- **twitter:site**: Define the official platform handle (`@WorldNewzs`).
- **article:published_time**: Required for news crawlers to verify date formatting.
- **article:modified_time**: Must represent the last modification date. In the React client, fall back to the publication date if no modification time is recorded to ensure rich snippets validator compliance.

### 14.2 RSS Feeds & Promotion
Promote server-rendered RSS feeds to enable content syndication and index discovery:
- **Endpoint**: ASP.NET Core serves XML feeds dynamically at `/rss/{feedType}` (e.g. `/rss/discover`, `/rss/sports`).
- **Discovery**: Expose feed URLs on the frontend footer as server-side redirects (using external `href` anchors to bypass React Client Routing).
- **Format**: Feed nodes must include custom enclosures (`<enclosure url="..." type="image/jpeg" />`) to support visual RSS readers.

### 14.3 Internal Linking Strategy
News authority is highly dependent on crawl-depth. Deep links help direct crawlers to under-indexed pages:
- **Related Articles**: Result and Full Text Article pages must render a "Related Stories" horizontal slider referencing category peers.
- **Anchor Bylines**: Article details must display clear, crawlable links pointing to specific author bio pages (e.g. `/author/marcus-sterling`).

### 14.4 Custom 404 Page (Soft vs Hard 404)
To prevent indexing of broken URLs:
- Custom 404 page must inject `<meta name="robots" content="noindex, nofollow" />` dynamically using `react-helmet-async` (handled by `SEOMeta` with the `noIndex` prop).

### 14.5 LCP Optimization (fetchpriority)
Largest Contentful Paint is a primary SEO ranking factor. News article hero images must load instantly:
- Hero images inside `ResultPage` and `ReadFullArticles` must be declared with `loading="eager"` and `fetchpriority="high"`.
- Above-the-fold news grids must eager load the first 3 images (`loading={index < 3 ? "eager" : "lazy"}` and `fetchpriority="high"` for eager targets) to prevent LCP delays.

### 14.6 AdSense Monetization Coexistence Warning
> [!WARNING]
> Do NOT combine Google Auto Ads and manual grid placements aggressively. Auto Ads dynamically inject script frames around DOM elements, which conflicts with manual `AdCard` placement structures. This causes cumulative layout shifts (CLS), user experience issues, and potential AdSense policy violations for exceeding acceptable ad-to-content ratios.

---

## Test Prompts for This Skill

1. "Generate the SEO meta tags for the WorldNewz technology category page"
2. "Create the sitemap.xml ASP.NET Core endpoint for WorldNewz"
3. "Set up react-helmet-async for dynamic per-article meta tags"
4. "Write the Privacy Policy component for WorldNewz React frontend"
5. "Create a Hangfire job to refresh keywords daily using Claude API"
6. "Generate NewsArticle JSON-LD schema for a WorldNewz article"
7. "What is robots.txt and what should WorldNewz include?"
8. "How do I set up Google Search Console for world-newz.vercel.app?"
9. "Fix the Core Web Vitals for my React Vite news site"
10. "Write Terms and Conditions for WorldNewz"
11. "Set up the SEO keyword API endpoint in ASP.NET Core"
12. "How do I make WorldNewz appear in Google Discover?"
13. "Generate all Open Graph and Twitter Card tags for WorldNewz"
14. "Create a BreadcrumbList schema for the Technology category"
15. "Ping Google sitemap after publishing a new article in ASP.NET Core"
