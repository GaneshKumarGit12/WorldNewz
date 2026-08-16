# WorldNewzs — UI/UX Redesign Guide

## 1. Why the original reads as inauthentic

The current homepage has good bones (clear top-story grid, personalization, market widgets) but several patterns undercut trust, which matters most for a news brand:

| Problem | Effect |
|---|---|
| "Buy on Amazon" product cards sit inside the news grid at the same visual weight as headlines | Reads as content-farm / affiliate-spam, not a newsroom |
| Orange used for both urgency badges ("Featured", "Sale") and primary navigation actions | No visual hierarchy — everything shouts, so nothing does |
| Placeholder image boxes are plain grey rectangles repeated dozens of times | Feels unfinished / template, not art-directed |
| Every card uses identical typography and rounded dark tiles | No sense of editorial voice or section identity |
| Interactive widgets (quiz, polls, arcade) are visually indistinguishable from hard news | Blurs "reporting" and "entertainment," which erodes credibility |
| No masthead conventions readers associate with real news (edition, dateline, byline formatting, verification signal) | Nothing tells the reader *this is a newsroom, not an aggregator* |

The redesign's core move is **separation of church and state**: editorial content, reader utilities, and commerce are visually and structurally distinct, the way NYT, BBC, or FT keep sponsored modules boxed and labeled rather than woven into the river of news.

## 2. Design tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#10172A` | Masthead, nav-adjacent surfaces, footer, briefing banner |
| `--paper` | `#F4F5F7` | Page background — cool, neutral off-white (deliberately not warm cream, to avoid the generic "AI design" cream+serif+terracotta combination) |
| `--paper-raise` | `#FFFFFF` | Cards, sidebar modules |
| `--text` | `#1A2233` | Body/headline text |
| `--slate` | `#5C6474` | Deks, secondary copy |
| `--red` | `#B7222B` | Single accent for urgency, live markers, active nav state — a press/masthead crimson, not a generic brand orange |
| `--gold` | `#9C7A2E` | Reserved exclusively for "verified" and briefing/editorial markers — never used for commerce |
| `--line` | `#DBDEE4` | Hairline rules |

**Rule:** red = *live/urgent*, gold = *editorial/verified*, and commerce never borrows either — the Marketplace module uses neutral grey only. This lets a reader instantly parse what kind of module they're looking at without reading it.

### Type
| Role | Face | Why |
|---|---|---|
| Display / headlines | **Source Serif 4** | Editorial authority, high readability at small sizes, distinct from the generic sans-everywhere look of the original |
| UI / body / navigation | **IBM Plex Sans** | Neutral, wire-service functionality — doesn't compete with headlines |
| Data / meta / timestamps | **IBM Plex Mono** | Bylines, tickers, dates set in mono to read as *data*, reinforcing the "verified, timestamped" positioning |

### Layout
- 12-column-equivalent grid, `1240px` max width, generous `28px` gutters
- Two-zone body: **main column** (news) + **fixed sidebar** (personalization, tools, commerce, market data) — commerce physically cannot appear inside the story river
- Consistent `section-head` pattern: serif H2 + hairline rule + mono meta label, used identically across every section so the eye learns the pattern once

## 3. The signature element: the Verification Strip

A thin gold strip beneath the masthead reading *"Edition No. 4,821 · 214 sources cross-checked today · Last verified 6 min ago."*

This does real work, not decoration:
- Borrows the visual language of a press credential / broadsheet edition line
- Gives the masthead a believable operational detail (an edition number, a live verification count) that a content-farm template would never include
- Anchors the "Verified" promise from the original hero copy in a persistent, structural element rather than a one-off headline claim

## 4. Information architecture changes

1. **Hero** — one lead story (large serif headline + dek + byline) beside a numbered "Most read" rail. Numbering is used *only* here because it's a genuine ranking, not decoration.
2. **Top Stories** — 3-up grid, one clear editorial category label per card.
3. **Editorial Briefings** — kept as a distinct dark banner (as in the original) but re-worded to state what it actually is — original analysis, not a generic CTA — with a quiet outlined button instead of a loud orange one.
4. **More Global News** — 4-up dense grid for scanning, matching the original's volume without visual noise.
5. **Trending Video** — reframed as an editorial video rail (9:16 thumbnails, play affordance, caption) rather than "shorts," matching newsroom video products.
6. **Sidebar (persistent)**:
   - *For You* — personalization, tabbed, small thumbnails
   - *Reader Tools* — quiz/poll/games/markets-sim grouped and clearly labeled as utilities, not news
   - *Marketplace Picks* — the **only** place products appear, explicitly labeled "Sponsored," neutral card styling
   - *Watchlist* and *Weather* — data-forward, monospace, minimal chrome

## 5. Accessibility & responsiveness baseline
- Visible focus states (`:focus-visible`) on all interactive elements
- `prefers-reduced-motion` respected (the build has minimal motion by design)
- Sidebar collapses under the main column at `<980px`; story grids reflow to 2-up
- Color pairs meet WCAG AA for body text (`#1A2233` on `#F4F5F7` / `#FFFFFF`)

## 6. What to reuse if extending this system
- Never introduce a third accent color — red and gold are semantically reserved
- New sections should follow the `eyebrow` → `serif H2` → `mono meta` header pattern
- Any future commerce integration goes in a `side-block market` module with a `Sponsored` tag — it does not enter the main story grid
