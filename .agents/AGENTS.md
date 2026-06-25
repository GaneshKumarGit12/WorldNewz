# WorldNewzs Rules, SEO & Content Guidelines

Whenever you are analyzing, generating, or updating articles for WorldNewzs, you MUST follow these content expansion guidelines:

## 1. Content Curation & Expansion
- **Adjust target length dynamically based on category**:
  - **Pillar Categories (Politics, Technology, Business, Science-Health)**: 1,500–2,000 words.
  - **Standard Categories (Sports, Entertainment, Money, etc.)**: 600–1,000 words.
- **Hierarchical Structuring**: Always structure sections logically with clear headings (`##`) and subheadings (`###`).
- **Comprehensive Coverage**: Ensure every article covers the following depth:
  - Historical context or background information.
  - Recent developments and real-time updates.
  - Expert opinions, quotes, and citations from authoritative sources.
  - Statistics, facts, and numerical references.
- **FAQ Section**: Include a dedicated `## Frequently Asked Questions (FAQs)` section at the end containing at least 3 detailed Q&As.
- **Formatting**: Use short paragraphs (2–3 sentences) with keyword-rich, natural phrasing for maximum readability and search crawler indexation.
- **Referential Links**:
  - Include 1–2 external links to authoritative sources (e.g. BBC, Reuters, WHO).
  - Include 1–2 internal links to relevant WorldNewzs categories (e.g. [Technology News](https://worldnewzs.in/technology)).

## 2. Google AdSense Guidelines
- **Original High-Value Content**: Avoid low-quality scraped material. Ensure all summaries, articles, and reviews add original commentary and editorial value.
- **Ad/Content Separation**: Keep clear visual separation between advertisements (e.g., `AdCard` components) and primary content widgets.
- **Layout Integrity**: Do not position buttons, video overlays, or carousel arrows in a way that encourages accidental clicks.

## 3. SEO & Semantic Structure
- **Heading Hierarchy**: Ensure there is exactly one `<h1>` tag per page describing the page content.
- **Semantic HTML**: Wrap major sections in standard HTML5 tags (`<main>`, `<article>`, `<section>`, `<nav>`, `<footer>`) rather than generic `<div>` wrappers.
- **Metadata Coverage**: Ensure each page updates the `SEOMeta` component with a unique title, localized meta-description, relevant keywords, and canonical URL.
- **Interactive Identifiers**: Assign unique and descriptive `id` attributes to all buttons, input fields, and checkboxes to assist browser accessibility and automated UI testing.

## 4. Performance & Core Web Vitals
- **Image Optimization**: Preload the first article's image (Largest Contentful Paint) using high fetch priority, and lazy-load all below-the-fold assets.
- **Cumulative Layout Shift (CLS)**: Always specify aspect ratios or explicit heights for image containers, iframe video players, and widgets to prevent shifts during render.
- **Code Splitting**: Lazy-load heavy components (e.g. charts, video players, and carousels) using `React.lazy` and `Suspense` placeholders.
