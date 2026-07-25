---
name: chatbot
description: WorldNewz Visual Chatbot architecture, placement, context adaptation, API integration, and maintenance guidelines.
---

# WorldNewz Visual Chatbot (AgentChatbot Skill)

This skill provides guidelines and operational procedures for managing, extending, and maintaining the **WorldNewz Assistant** (embedded visual chatbot) across WorldNewz.in.

---

## 1. System Overview & Placement Rules

The WorldNewz Assistant is a **global visual chatbot** embedded on every page template of WorldNewz.in.

### Placement Exclusions
- **Show on**: Homepage, Article/story pages, Category pages (World, Business, Tech, etc.), Shopping/deals, Weekend Ideas/lifestyle, Search results, Tag/author pages, Static pages (About, Contact, Privacy).
- **Hide on**: Transactional & administrative flows to prevent UI distraction:
  - `/admin` (Admin dashboard & login)
  - `/facebook-settings` (Social API authorization flow)
  - `/jobs/post-job` (Job post submission form)

---

## 2. Visual Spec & Interaction States

| Element | Specification |
|---|---|
| **Launcher Button** | Fixed bottom-right: `26px` desktop / `16px` mobile. Size `58x58px` desktop / `50x50px` mobile. |
| **Idle Indicator** | Pulsing dot (`#2EC4B6` teal) on top-right of launcher icon. |
| **Hover Tooltip** | "Ask WorldNewz Assistant" — displayed once per session on first hover. |
| **Z-Index** | `9990` (below modals/cookie consent, above main content). |
| **Panel Width** | Desktop (≥1024px): ~400px docked panel. Tablet (600–1023px): ~85% viewport width. Mobile (<600px): Fullscreen sheet with header close affordance. |
| **State Persistence** | History stored in `sessionStorage` (`worldnewz_assistant_history`). Resets on session end/tab close. |

---

## 3. Section Context Adaptation

The chatbot automatically detects the current page route and adapts its tone, accent color, and system instructions:

| Context | Route Patterns | Tone & Emphasis | Accent Color | Mode Pill Label |
|---|---|---|---|---|
| **News** | `/`, `/technology`, `/business`, `/sports`, `/politics`, `/science-health`, `/article/*`, search, default | Informative, neutral, concise bullets & comparison tables. | `#E63946` | `📰 NEWS MODE` |
| **Shopping** | `/shopping`, `/amazon-products`, `/deals` | Persuasive yet honest. Product verdict + pros/cons + rating/price tags + CTAs + inline sponsorship label. | `#F4A340` | `🛍️ SHOPPING MODE` |
| **Ideas** | `/lifestyle`, `/food`, `/travel`, `/cartoons` | Creative, casual, upbeat, emoji-friendly short punchy lists. | `#2EC4B6` | `💡 IDEAS MODE` |
| **Help** | `/about`, `/contact`, `/privacy-policy`, `/terms`, `/disclaimer`, `/editorial-*` | Plain, concise answers focused strictly on site help & policies. | `#E63946` | `ℹ️ HELP MODE` |

### Mid-Chat Context Switch Notice
When a user navigates to a different context while the chat panel is open or active, a system notice chip is rendered in the chat stream:
> *"Switched to Shopping mode — I can help you compare picks here!"*

---

## 4. API & Backend Contract

- **Endpoint**: `POST /api/chatbot/ask`
- **Request Payload**:
  ```json
  {
    "query": "What are the top tech deals?",
    "context": "shopping",
    "history": [
      { "sender": "user", "text": "Hello" },
      { "sender": "bot", "text": "Hi! How can I help you today?" }
    ]
  }
  ```
- **Response Payload**:
  ```json
  {
    "reply": "Here are top tech deals today...",
    "visualMockPrompt": "optional descriptive prompt if image requested",
    "generatedImage": "data:image/png;base64,... (if Cloudflare image generator generated image)"
  }
  ```

---

## 5. SEO, Accessibility & AdSense Guidelines

1. **Heading & Landmark Structure**: Panel wraps header in `<h3>`, main history in scrollable container, composer controls with explicit `id` attributes.
2. **Keyboard Controls**:
   - `Tab` / `Shift+Tab`: Focus traps within composer input and actions.
   - `Esc`: Minimizes panel back to launcher button.
3. **Accessibility Attributes**:
   - Launcher button: `aria-label="Open WorldNewz Assistant"` with visible focus ring.
   - Minimum tap targets: 44×44px on touch devices.
   - Respects `prefers-reduced-motion` for pulse animation and transitions.
4. **AdSense Compliance**:
   - Maintains strict separation between AdCard components and chatbot overlay.
   - Prevents auto-opening panel unprompted on page load or scroll.
   - Discloses affiliate/sponsored links explicitly in shopping mode.
