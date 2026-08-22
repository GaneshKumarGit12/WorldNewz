---
name: postcasts
description: Fetch and render the "Podcasts & Videos" news section from worldnewzs.in (YouTube-style podcast/video news digest). Use when the user asks to pull, refresh, or display WorldNewzs' podcasts/videos feed, or to rebuild the mockup UI for it.
---

# WorldNewzs — Podcasts & Videos Skill

## Source
- Page: `https://worldnewzs.in/podcasts-videos`
- Site theme color: `#0f172a` (dark), supports `dark light` color-scheme
- Category taxonomy (site-wide, shared nav): Politics, Technology, Business, Science & Health,
  Sports, Money, Weather, Stocks, Badge Quiz, Polls, Jobs Board, Movies, Transportation,
  AI Assistant, Deals & Shopping, Editorial Briefings, Play Games

## How to fetch
Use `web_fetch` on the URL above. Only URLs already surfaced in the conversation (typed by the
user, or returned by a prior search/fetch) can be fetched — don't guess sibling category URLs
that haven't appeared yet; fetch them explicitly first if needed (e.g. `/politics`, `/technology`).

## Known limitation — no server-rendered episode list
As of the last fetch (Aug 22, 2026), the static HTML returned by `web_fetch` does **not** contain
actual episode/video entries. The `## Latest Articles & Briefings in podcasts-videos` heading is
present but empty — the real listing is populated client-side (JS) and isn't visible to a plain
fetch. What *is* present and reusable:

- Page title, meta description, OG/Twitter tags
- A generic "Editorial Overview & Sector Background" boilerplate paragraph (near-identical
  template is reused across WorldNewzs' other category pages — treat this as filler copy, not
  section-specific reporting)
- A 4-question FAQ block (update cadence, sourcing, bookmarking, fact-checking)
- The site-wide category/utility nav links

**Implication:** don't fabricate specific episode titles, hosts, or timestamps as if they were
scraped from the live page — they weren't. Either (a) note the section renders empty in a plain
fetch and suggest the user share a saved copy of the rendered page / API response if they want
real entries reflected, or (b) build a mockup/placeholder UI clearly understood to be illustrative.

## Rendering the section
A reference mockup (dark "broadcast console" theme, matching the site's `#0f172a` dark scheme)
is available at `podcasts-videos-mockup.html` alongside this file. It includes:
- Sticky header with category nav
- Featured player hero (waveform, live/duration chips)
- Filterable grid of video/podcast cards (thumbnail, format tag, duration, category, date)
- FAQ accordion sourced from the real FAQ copy above
- Footer nav matching the site's actual category list

To refresh it with real data once the client-rendered listing is accessible (e.g. via a page
snapshot, their API, or an updated fetch that includes the populated section), replace the six
placeholder `.card` blocks with real entries, keeping the same markup shape:
`thumb (format tag + duration) → tag (category) → h4 (title) → card-meta (source, date)`.

## Next steps if real episode data is needed
- Ask the user for a saved/rendered HTML snapshot of the page, or
- Check if WorldNewzs exposes a JSON/RSS feed for this section (try `/feed`, `/api/podcasts-videos`,
  or an RSS link in the page `<head>` on a future fetch), or
- Re-fetch periodically — dynamic content occasionally gets included in server responses if the
  site changes its rendering approach.
