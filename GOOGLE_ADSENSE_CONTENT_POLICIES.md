# Google AdSense Content Policies & Compliance Guide

This document establishes the guidelines for publishing content and placing ads on WorldNewz to ensure strict compliance with Google AdSense program policies. All authors, editors, and developers must adhere to these standards.

---

## 1. Content Quality & Minimum Value Standards

Google AdSense enforces strict guidelines against **thin content** and **duplicate/scraped content**. 

### 1.1 Dynamic Target Article Length
To prevent "low-value content" flags, articles must meet the following length targets:
- **Pillar Categories (Politics, Technology, Business, Science & Health):** **1,500 – 2,000 words** of original, deep-dive reporting and analysis.
- **Standard Categories (Sports, Entertainment, Money, etc.):** **600 – 1,000 words** per article.
- **Breaking News / Briefs:** Minimum of **400 words** containing original commentary or synthesized background context. Never publish stub articles under 300 words.

### 1.2 Structure & Readability
- **Hierarchical Formatting:** Articles must use clear heading hierarchies. Exactly one `<h1>` per page (the title), followed by logical `<h2>` and `<h3>` tags for subsections.
- **Paragraphs:** Keep paragraphs short and readable (2–3 sentences, 50–80 words maximum). A minimum of 4–6 paragraphs is required for standard articles.
- **Citations & Linking:** Provide 1-2 outbound links to authoritative external sources (e.g., Reuters, BBC, WHO) and 1-2 internal links to relevant WorldNewz categories (e.g., [Technology News](https://worldnewzs.in/technology)).

---

## 2. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

AdSense and search engines heavily favor sites with strong E-E-A-T signals.

### 2.1 Author Attribution & Bios
- Every article must display a visible author name byline (e.g., "By John Doe").
- The byline must link to an [AuthorBioPage](file:///c:/WorldNewz/worldnewz_UI/src/pages/AuthorBioPage.tsx) that outlines the author's credentials, qualifications, and editorial history.

### 2.2 Timestamps & Integrity
- All articles must clearly show the **Publish Date** and, if edited later, the **Last Updated Date**.
- Corrections or retractions must be clearly noted in the article body with absolute transparency.

---

## 3. Ad Placement & Layout Integrity

Google enforces strict limits on how ads are displayed relative to content to prevent accidental clicks and poor user experience.

### 3.1 Visual Separation of Ads and Content
- Ads must not be positioned in a way that blends them deceptively into the news content.
- Use the standard `AdCard` component which enforces clear margins, background borders, and a mandatory label: `"Advertisement"` or `"Sponsored Content"`.
- Avoid placing buttons, image carousel arrows, or navigation elements directly adjacent to ads to prevent accidental clicks.

### 3.2 Ad-to-Content Ratio
- Do not exceed a **30% ad density** on any page. Content must always remain the primary focus of the page.
- **Coexistence Warning:** Do not combine aggressive Google Auto Ads with manual `AdCard` grids. This practice causes layout shift (CLS) and violates policy.

---

## 4. Technical Compliance & Verification

### 4.1 Ads.txt Verification
- Ensure that the `/ads.txt` file is present in the public/root directory and contains the active publisher account registration:
  ```text
  google.com, pub-7547748414764075, DIRECT, f08c47fec0942fa0
  ```

### 4.2 Legal Pages
- The site footer must contain active links to:
  - [Privacy Policy Page](file:///c:/WorldNewz/worldnewz_UI/src/pages/PrivacyPolicyPage.tsx)
  - [Terms & Conditions Page](file:///c:/WorldNewz/worldnewz_UI/src/pages/TermsPage.tsx)
  - [Contact Page](file:///c:/WorldNewz/worldnewz_UI/src/pages/ContactPage.tsx)
