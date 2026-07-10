# Adsterra Integration Reference Guide

This document serves as a reference for the Adsterra ads and monetization assets integrated into WorldNewzs.

## 1. Anti-Adblock JS Sync
To protect advertising revenues from ad blockers, the Anti-Adblock JS Sync script is loaded in the `<head>` section of `index.html` so it executes early during page boot.

- **Source URL**: `https://servicessitclaims.com/03/97/72/0397728d20042b289231d6ab415deb70.js`
- **Location**: [index.html](file:///c:/WorldNewz/worldnewz_UI/index.html) (inside the `<head>` element, right after the verification tags)

---

## 2. Banner 728x90 (Desktop/Tablet)
Standard 728x90 banner ads are loaded dynamically when the user is on a desktop or tablet viewport (width >= 768px).

- **Script Code**:
  ```html
  <script>
    atOptions = {
      'key' : 'bf9bede62cc1cd83c4fad46360bd114e',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/bf9bede62cc1cd83c4fad46360bd114e/invoke.js"></script>
  ```
- **Location**: [AdCard.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/AdCard.tsx)
- **Loading Mechanism**: Dynamically loaded inside a `useEffect` using DOM script creation and injection. It targets placements like `play-games-banner`, `weather-page-bottom`, and `between-articles` only when `isMobile` is false and the component enters the viewport.

---

## 3. Smart Link Monetization
The Smart Link is used as a click-through redirect to monetize mobile traffic and promote high-value partner offers.

- **URL**: `https://servicessitclaims.com/adjy687gk?key=bc72885b3b812917f1e35083ca18d3a5`
- **Locations**:
  - **Mobile Ad Fallback**: Inside [AdCard.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/AdCard.tsx), if the screen size is < 768px (or if the desktop banner script fails to generate an iframe/is blocked), a premium sponsored card is rendered. Clicking anywhere on the card opens the Smart Link in a new tab.
  - **Affiliate Deals Page**: Inside [AffiliateDeals.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/AffiliateDeals.tsx) under generic fallback deals (`GENERIC_DEALS`).
  - **Contextual Deals Widget**: Inside [ContextualDealsWidget.tsx](file:///c:/WorldNewz/worldnewz_UI/src/components/ContextualDealsWidget.tsx) under the default deals list.

---

## 4. Key Implementation Rules
- **Aspect Ratio & CLS**: For the 728x90 banner, the `AdCard` sets a stable `minHeight: 90` wrapper. For sponsored cards, a stable `minHeight: 320` is maintained. This prevents layout shift (CLS) during page loading.
- **Lazy Loading**: Scripts are only injected when the `AdCard` container intersects with the viewport (using an `IntersectionObserver`), saving network bandwidth and maintaining fast PageSpeed scores.
- **Fail-safe Fallback**: An 8-second timeout checks if the Adsterra iframe was successfully created. If blocked by local firewall policies or extensions, it gracefully switches to the sponsored card redirecting to the Smart Link, guaranteeing 100% ad fill-rate.

---

## 5. Content Security Policy (CSP)
To prevent the browser from blocking Adsterra script execution, connections, or iframes, the following domains must be whitelisted in the Content Security Policy:
- `https://*.servicessitclaims.com`
- `https://servicessitclaims.com`
- `https://*.highperformanceformat.com`
- `https://highperformanceformat.com`

These domains have been whitelisted in the `script-src`, `connect-src`, and `frame-src` directives in the following configuration files:
1. [vercel.json](file:///c:/WorldNewz/vercel.json) (Root Vercel Config)
2. [worldnewz_UI/vercel.json](file:///c:/WorldNewz/worldnewz_UI/vercel.json) (Frontend UI Vercel Config)
3. [worldnewz_UI_backup/vercel.json](file:///c:/WorldNewz/worldnewz_UI_backup/vercel.json) (Backup Vercel Config)
4. [api/prerender.js](file:///c:/WorldNewz/api/prerender.js) (Serverless Prerender Edge Function)
