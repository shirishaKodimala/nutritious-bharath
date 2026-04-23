# Nutritious India — Product Requirements Document (Phase 1 MVP)

## Vision
"Traditional Wisdom Meets Modern Science" — A nutrition companion app for Indian mothers raising children aged 2-3 years, blending Ayurvedic knowledge with modern pediatric nutrition science.

## MVP Scope (Phase 1, Essentials)
Mobile-first Expo React Native app with bottom tab navigation.

## Implemented Features

### 1. Onboarding
- 3-slide welcome carousel (Tradition → Science → AI)
- Child profile form: mother's name, child's name, age (months), weight (kg), height (cm), allergies, region (North/South/East/West/Pan-India), dietary (Veg/Non-Veg/Jain), language (EN/HI/TE)
- Skip to form option

### 2. Home Dashboard
- Personalized greeting ("Namaste, [Mother]")
- Seasonal wisdom banner with cultural motifs
- Growth snapshot card (weight, height, status: on-track / below / above)
- Child age card
- Today's meal suggestion (random lunch recipe, clickable)
- Tip of the day (rotates daily)
- Quick actions to Recipes & Meal Plan
- Pull-to-refresh

### 3. Recipes (50 seeded)
- Categories: Breakfast (12), Lunch (14), Snack (12), Dinner (12)
- Search by title/description
- Category filter (horizontal chips)
- Each recipe has: title in EN/HI/TE, category, region, age range, prep+cook time, difficulty, description, ingredients list, step-by-step, nutrition facts, image, Ayurvedic ✓ badge, Scientific ✓ badge, rating
- Recipe detail: hero image with badges, metadata row (prep/cook/rating), nutrition grid, ingredients with bullets, numbered steps, back navigation

### 4. AI Meal Planner
- Powered by **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) via Emergent LLM key
- Generates personalized 7-day plan (Mon-Sun) based on child's age, region, allergies, dietary preference
- Each day: breakfast, lunch, snack, dinner + Ayurvedic/nutrition tip
- Shopping list auto-generated
- Swipeable day selector, collapsible shopping list
- Regenerate option
- Graceful rule-based fallback if LLM fails

### 5. Profile
- Mother's avatar card
- Child card with stats (weight, height, BMI) + growth status badge
- Diet, region, allergies info rows
- Language toggle EN / हिन्दी / తెలుగు — persists via backend
- Edit profile (re-runs onboarding form)

### 6. Community (placeholder)
- "Coming Soon" screen with teaser features: Local circles, Recipe sharing, Expert Q&A, Success stories

## Tech Stack
- **Frontend**: Expo SDK 54, Expo Router (file-based), React Native 0.81, TypeScript, @expo/vector-icons, AsyncStorage
- **Backend**: FastAPI, Motor (MongoDB async), Pydantic, emergentintegrations (Claude)
- **Database**: MongoDB (collections: profiles, recipes, meal_plans)
- **AI**: Claude Sonnet 4.5 via Emergent LLM Universal Key

## API Endpoints (prefix `/api`)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/profile` | Get singleton profile |
| POST | `/profile` | Upsert profile |
| GET | `/recipes?category=&region=&search=` | List/filter recipes |
| GET | `/recipes/{id}` | Recipe detail |
| POST | `/meal-plan/generate` | Generate 7-day plan (Claude) |
| GET | `/meal-plan/latest` | Get most recent plan |
| GET | `/growth/assessment` | WHO-based growth status |

## Design System
- Colors: Terracotta #D2691E, Turmeric #FFB84D, Basil #7BA474, Saffron Cream #F4E4C1, Indigo #4B0082, Spice Brown #8B4513, Marigold #FF8C00
- Typography: Serif for headings, system sans for body, native Devanagari/Telugu rendering
- Radius: 8px cards, 12px buttons, round chips
- Shadows: Warm brown-tinted (not gray/black)
- Ayurvedic badge (green) + Scientific badge (indigo) with icon

## Not in MVP (Deferred)
- Authentication (using local singleton profile for now)
- Video tutorials, voice search, barcode scanning
- Community social features, expert consultations
- Healthcare integrations, payment flows
- Ages 0-2 and 3-18 coverage (Phase 2 & 3 roadmap)

## Smart Enhancement Opportunity
**Recipe shareability**: Add a "Share this recipe" deep-link button that creates a branded image card of the recipe (with Nutritious India watermark + Ayurvedic badge). This drives organic WhatsApp-based viral growth among Indian mother communities — the highest-engagement distribution channel in India. Pairs naturally with the upcoming Community phase.

## Status
✅ Backend: 12/12 tests passing (live Claude Sonnet 4.5 verified)
✅ Frontend: All 5 tabs + onboarding + recipe detail built with design-system tokens
✅ 50 recipes seeded on startup
✅ i18n EN/HI/TE across all user-facing strings
