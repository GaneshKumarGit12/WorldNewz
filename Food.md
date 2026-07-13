# WorldNewzs Food & Recipe Dashboard Service Documentation

This document serves as the complete technical specification and maintenance guide for the **Food & Recipe Dashboard**, API service architecture, security protocols, and UI components on WorldNewzs (`worldnewzs.in/food`).

---

## 1. System Architecture Overview

The food subsystem follows a secure **Server-Side Reverse Proxy & Data Aggregation** model to consume Spoonacular services safely:

```
┌─────────────────────────┐     GET /api/food/...     ┌──────────────────────────────┐
│ React + TypeScript UI   │ ────────────────────────> │ ASP.NET Core WebAPI          │
│ (Food.tsx & apiClient)  │ <──────────────────────── │ (FoodController & Service)   │
└─────────────────────────┘  JSON Telemetry Response  └──────────────┬───────────────┘
                                                                     │
                                            ┌────────────────────────┴───────────────────────┐
                                            │ Secure Backend Data Sources                    │
                                            │  ├── Spoonacular Recipe and Food API (Secured) │
                                            │  └── newsapi.org (Fallback articles)           │
                                            └────────────────────────────────────────────────┘
```

---

## 2. API Key Security & Vulnerability Controls

> [!IMPORTANT]
> **Key Security Protocol**: The Spoonacular Recipe and Food API key (`69d5dc501f854ee0adc15f1e9edceb4f`) is stored **exclusively on the backend** inside `WorldNewzWebAPI/.env` as `SPOONACULAR_API_KEY`. It is NEVER bundled in client-side JavaScript or returned in API responses.

### Security Controls Implemented:
1. **SSRF / Injection Protection**: Inputs passing to Spoonacular (like `query`, `diet`, `type`) are verified and mapped strictly in ASP.NET Core parameters before proxying.
2. **Downstream Cache Protection**: API responses from Spoonacular search results and random recipes are cached using ASP.NET Core `IMemoryCache` for **30 minutes**, while individual recipe detail reports are cached for **1 hour**, dramatically reducing API token consumption and defending against request floods.
3. **Internal Error Isolation**: Exception details, upstream API limits, or API key references are securely logged and NEVER exposed to client browsers.

---

## 3. UI Dashboard Layout & Reference Design System

The food dashboard matches the sleek modern glassmorphism reference design of WorldNewzs:

### 3.1 Overview Grid Section
- **Recipe Cards**: Visual layout displaying the high-resolution culinary dish image (utilizing aspect-ratio padding to prevent Cumulative Layout Shift), health score badge (`Health: 85`), cook time pill (`35 Min`), and servings indicator.
- **Search & Chips Filters**: Search text input coupled with preset chips for diets (e.g. Vegetarian, Vegan, Gluten-Free, Ketogenic) and meal categories (e.g. Main Course, Breakfast, Dessert).
- **Sponsored Separation**: Visual integration of `<AdBannerCard />` inline with the recipe cards to separate AdSense placements cleanly and comply with Accident Click layout guidelines.

### 3.2 Recipe Details Dialog Modal
- **Calorie Progress Dashboard**: Horizontal progress bars displaying the dynamic macronutrient percentage breakdown (Carbohydrates, Fats, Proteins) alongside absolute Calorie counts.
- **Interactive Checklist**: Dynamic checkbox lists for ingredients allowing home cooks to check off items as they prepare the recipe.
- **Cooking Instructions**: Order-numbered steps rendered in clear bulleted layouts.

---

## 4. Maintenance & Future Extensions

- **Refreshing API Keys**: To update the Spoonacular key, edit `SPOONACULAR_API_KEY` in `WorldNewzWebAPI/.env`.
- **Diet & Meal Types**: Additional filter values can be registered in the frontend constants `DIET_FILTERS` and `MEAL_FILTERS` inside [Food.tsx](file:///c:/WorldNewz/worldnewz_UI/src/pages/Food.tsx).
