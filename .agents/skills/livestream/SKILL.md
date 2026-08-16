---
name: livestream
description: Comprehensive guide and operational procedures for WorldNewzs 24/7 Live Stream videos, YouTube API v3 integration, category broadcast mapping, HeroLeadMedia player component, and automated daily video updates.
---

# WorldNewz Live Stream & Daily Video Management (AgentLiveStream Skill)

This skill provides guidelines and operational procedures for managing, configuring, extending, and maintaining **Live Video Streams & Daily Dynamic Videos** across all Lead Story hero sections in WorldNewzs.

---

## 1. Architecture & Core Workflow

The live stream system operates on a high-availability, multi-tiered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    WORLDNEWZ UI (React)                    │
│                                                             │
│  [HeroLeadMedia Component]                                  │
│  - Active Tab: [🔴 Live Broadcast] / [📷 Lead Photo]         │
│  - Pulsing Live Badge & Channel attribution                 │
│  - Lazy-loaded no-cookie iframe (0 API Quota on embed)      │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               │ GET /api/livestreams?cat=...  │ Fallback Registry
               ▼                               │ (fallbackLiveStreams.ts)
┌──────────────────────────────────────────────┴──────────────┐
│                WORLDNEWZ WEB API (ASP.NET Core)             │
│                                                             │
│  [LiveStreamsController & LiveStreamService]                │
│  - In-Memory Cache (1-hour TTL per category)                │
│  - YouTube Data API v3 (eventType=live) using WN_YOUTUBE_KEY│
│  - Category Broadcast Mapping & High-Reliability Fallbacks  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Category Live Stream Registry & Fallback Mappings

Each category is mapped to verified 24/7 live news broadcasts and relevant daily search queries:

| Category | Channel / Source | Fallback Video ID | Search Query |
| :--- | :--- | :--- | :--- |
| **World & Politics** (`politics`, `opinion`) | Sky News Live | `9Auq9mYxFEE` | `Sky News live breaking news broadcast` |
| **Business & Stocks** (`business`, `money`, `stocks`) | Bloomberg Television | `dp8PhLsUcFE` | `Bloomberg markets and finance live broadcast` |
| **Technology** (`technology`, `gaming`) | Tech Today Live / CNET | `_yK2NfH_t6M` | `tech live breaking technology news updates` |
| **Science & Health** (`science-health`, `weather`) | NASA Live / Space | `21X5lGlDOfg` | `NASA live stream space and science updates` |
| **Sports** (`sports`) | Sky Sports News Live | `vQK_p7x9bC0` | `Sky Sports News live sports updates breaking` |
| **Entertainment** (`entertainment`, `movies`, `food`, `lifestyle`) | Live Spotlight | `9Auq9mYxFEE` | `entertainment tonight live news Hollywood` |
| **Discover / Home & Local** (`general`, `local`) | WorldNewzs Live 24/7 | `9Auq9mYxFEE` | `Sky News live 24 7 world news broadcast` |

---

## 3. Environment Variables & API Key Handling

The live stream service shares the existing YouTube Data API v3 key with short videos:
* **Environment Variable**: `WN_YOUTUBE_KEY`
* **API Quota Management**: 
  - Searches consume minimal search units (100 units per search).
  - In-memory 1-hour cache prevents excessive API hits.
  - Iframe embedding (`youtube-nocookie.com/embed/...`) consumes **0 YouTube API quota units**.

---

## 4. Key Files & Components

1. **Backend Service & Controller**:
   - `WorldNewzWebAPI/Services/LiveStreamService.cs`: Manages category queries, in-memory caching, and YouTube API calls.
   - `WorldNewzWebAPI/Controllers/LiveStreamsController.cs`: Exposes `GET /api/livestreams?category={category}`.
   - `WorldNewzWebAPI/Extensions/ServiceExtensions.cs`: Registers `LiveStreamService` in DI.

2. **Frontend UI**:
   - `worldnewz_UI/src/components/common/HeroLeadMedia.tsx`: Reusable Lead Media player component with Live/Photo toggle.
   - `worldnewz_UI/src/utils/fallbackLiveStreams.ts`: Instant offline-resilient fallback dictionary.
   - `worldnewz_UI/src/api/apiClient.ts`: Defines `LiveStreamItem` and `fetchLiveStream(category)`.
   - `worldnewz_UI/src/components/CategoryPage.tsx`: Integrates `HeroLeadMedia` for all category pages.
   - `worldnewz_UI/src/components/Discover.tsx`: Integrates `HeroLeadMedia` for homepage lead story.
   - `worldnewz_UI/src/pages/LocalNews.tsx`: Integrates `HeroLeadMedia` for local/regional lead story.

---

## 5. Maintenance & Customization Tasks

### Adding or Updating a Live Channel
1. To change a fallback live video ID, update both:
   - `WorldNewzWebAPI/Services/LiveStreamService.cs` (`GetFallbackLiveStream` method)
   - `worldnewz_UI/src/utils/fallbackLiveStreams.ts` (`fallbackLiveStreams` map)
2. To modify YouTube query parameters, update `GetCategorySearchQuery` in `LiveStreamService.cs`.

### Switching Default Mode (Live Video First vs Photo First)
In `HeroLeadMedia.tsx`, the `defaultMode` prop controls whether the component starts on `photo` or `video`.
To start with video playing immediately on specific sections:
```tsx
<HeroLeadMedia
  imageUrl={leadStory.urlToImage}
  category={leadStory.category}
  title={leadStory.title}
  defaultMode="video"
/>
```
