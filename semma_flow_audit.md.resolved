# 🔬 HabitForge (semma-flow) — Full Startup Product Audit

> **Auditor mindset:** Senior Full-Stack Architect + UX Critic + Angel Investor + Real User
> **Stack:** Next.js 16 · React 19 · TypeScript · Supabase · Tailwind v4 · Framer Motion · Recharts · Zod

---

## 1. 🎯 Product Quality

### What problem does this solve?
HabitForge is a premium, data-rich habit tracking tool. The core loop: *define → track → visualize → improve*. It's differentiated from basic trackers (Streaks, Loop) by offering real analytics, a mood layer, a year-view heatmap, realtime sync, and an achievement system.

### Who would use it?
- **Primary:** 18–35 year-old productivity-obsessed individuals (builders, students, knowledge workers)
- **Secondary:** Athletes tracking training routines
- **Potential stretch:** Wellness coaches managing client habits

### Is it useful enough for real users?
**Mostly yes.** The depth — backfill logging, category grouping, numeric/duration targets, mood correlation, achievement badges — is well beyond what typical solo-build trackers offer. The feature floor is high.

### Missing killer features
| Feature | Impact | Why Missing = User Churn |
|---|---|---|
| Push notifications / reminders | 🔴 Critical | Reminder time stored in DB but never sent |
| Habit streak freeze | 🔴 Critical | `streak_freeze_count` in schema, never surfaced in UI |
| Mobile app / PWA manifest | 🔴 Critical | No `manifest.json`, no service worker |
| Onboarding wizard | 🟠 High | New user sees an empty dashboard with no guidance |
| Social / Accountability partner | 🟡 Medium | Big retention driver, completely absent |
| AI-generated weekly report email | 🟡 Medium | Data is there, no email pipeline |
| Widget / lock-screen check-in | 🟡 Medium | Makes habits frictionless |
| Data export (CSV/PDF) | 🟡 Medium | `/api/export` directory exists but is empty |

### How to make it addictive (positively)
- **Daily streak fire emoji** with sound effect when you hit 100%
- **Monday morning summary email** (e.g., "You completed 89% last week — your best week ever!")
- **Micro-celebration confetti** already partially coded (`confetti-particle` CSS exists), needs wiring
- **Progressive challenge system**: After 30 days, app suggests "harder mode" of a habit
- **Friend invites**: "Mohan just hit a 14-day streak on Morning Run 🔥" — share card

---

## 2. 🎨 UI / UX Review

### Layout Quality: **8 / 10**
The two-column dashboard grid (`hf-dashboard-grid`) with a 2fr/1fr split is professional. The `maxWidth: 1280` container keeps content from stretching too wide on ultrawide screens. The `clamp(22px, 2.4vw, 28px)` heading is a sophisticated touch.

**Issues:**
- The dashboard page itself stacks **9 separate components** vertically. On first load, there's no visual hierarchy — everything has the same elevation. The FocusBanner, OverviewStats, InsightCards, ProgressChart, and TodayHabits all have similar visual weight.
- No page-level skeleton loading state — if Supabase is slow, users see a blank page.

### Visual Hierarchy: **7 / 10**
- ✅ The eyebrow + hero-line pattern (monospace date + contextual h1) is excellent — editorial and premium.
- ✅ The Live indicator dot in TodayHabits is a delightful detail.
- ❌ The "Overview · Apr 28" eyebrow is tiny and easy to miss.
- ❌ `FocusBanner` and `OverviewStats` both compete for attention at the top of the page.

### Premium Feel: **7.5 / 10**
- ✅ The dark theme token system (`--bg-primary: #08090F`) is extremely tasteful — not generic purple-dark.
- ✅ Custom SVG progress chart (no Recharts for the main chart) with cardinal spline smoothing shows real engineering care.
- ✅ The glass morphism implementation (`backdrop-filter: blur(20px) saturate(160%)`) is restrained — product-grade, not gimmicky.
- ❌ The landing page (`Hero.tsx`) is **severely underdeveloped** for a product this capable. It has just a headline, two CTAs, and 3 feature tiles. No screenshots, no social proof numbers, no testimonials.
- ❌ The icon system asks users to **type a Lucide icon name as a text string** — that is a developer experience, not a user experience.

### Mobile Responsiveness: **7 / 10**
- ✅ Proper breakpoints in `globals.css` — the `hf-dashboard-grid`, `hf-stats-grid`, and `hf-mobile-nav` classes are well-considered.
- ✅ iOS zoom-on-focus prevention (`input { font-size: 16px !important }`) shows real-world polish.
- ❌ The `YearHeatmap` (365 squares) likely overflows horizontally on phones — no explicit horizontal scroll container observed.
- ❌ The `ProgressChart` uses an inline SVG with pixel-based sizing that starts at `w: 300` — will be cramped on 375px screens until the ResizeObserver fires.
- ❌ No bottom-sheet UX for modals on mobile (`hf-modal-backdrop` uses `align-items: flex-end` which is correct, but the backfill modal lacks a drag handle).

### Color Psychology: **8.5 / 10**
- The mint green `#10E5B0` accent is energetic without being aggressive — communicates growth and health perfectly.
- The dual-token warm `#F4B740` / danger `#F07272` creates clear semantic meaning.
- **Risk:** The light theme switches accent to `#059669` (Emerald 600) — much lower contrast against `#FAFAFC` backgrounds than the dark theme equivalent. Needs WCAG AA audit.

### Typography: **9 / 10**
- The trio of Inter (body) + Outfit (headings) + IBM Plex Mono (data/labels) is a genuine premium typographic system. This is better than most Series A startups.
- The `eyebrow` class (uppercase monospace, `letter-spacing: 0.14em`) creates a clean editorial voice.
- **Minor issue:** The font stack loads all three Google Fonts synchronously in `<head>` — should use `font-display=swap` to avoid render blocking (the `?display=swap` query param is already there, ✅).

### User Onboarding: **3 / 10** ⚠️
This is the biggest UX hole. A brand-new user:
1. Signs up → lands on `/dashboard`
2. Sees empty `TodayHabits` with a "No habits yet" state
3. That's it

There is **no onboarding wizard**, no sample habits, no first-run tour, no "what do you want to track?" prompt. The heroLine message `"Start by adding your first habit."` is functional but cold. **Empty state conversion is where retention is made or lost.**

### Empty States: **6 / 10**
- `TodayHabits` empty state is nicely centered with a Plus icon and a CTA button ✅
- `ActivityFeed`, `InsightCards`, `WeeklyOverview`, and `YearHeatmap` likely show blank/minimal states with no call to action or encouragement
- Missing: illustrated empty states (even simple SVG illustrations would 10x the feel)

### Micro Animations: **7.5 / 10**
- ✅ `confetti-particle` CSS animation exists and fires on habit completion
- ✅ `glow-pulse` on the Live indicator dot is subtle and satisfying
- ✅ Framer Motion used in InsightCards (staggered `delay: i * 0.04` fade-up), Hero, ProgressChart line draw
- ❌ `HabitCard` toggle doesn't appear to have a satisfying animation on completion (no scale, no color sweep)
- ❌ No page-transition animations between `/dashboard/*` routes

### Dashboard Experience: **7.5 / 10**
Content is rich. The FocusBanner → stats → insights → chart → habits flow makes logical sense. The ActivityFeed and MoodLogger as right-column widgets is smart. The biggest issue is **information density** — the dashboard tries to show everything at once and becomes overwhelming for a new user.

---

## 3. 💻 Frontend Code Review

### Folder Structure: **9 / 10**
```
app/          → routes (Next.js App Router)
components/   → colocated by domain (habits/, dashboard/, layout/, ui/, landing/)
lib/          → utilities, hooks, Supabase clients, validations, constants
types/        → TypeScript interfaces
supabase/     → migrations
```
This is a textbook, production-grade Next.js structure. The separation of `lib/supabase/server.ts` and `lib/supabase/client.ts` is exactly right.

### Reusable Components: **8 / 10**
- `Button`, `Input`, `Modal`, `Card`, `Badge`, `Toast`, `ProgressRing`, `Skeleton` — a solid, purpose-built primitive library
- `SegmentedControl<T>` generic component inside `HabitForm.tsx` is elegant
- **Issue:** `SegmentedControl` is defined inside `HabitForm.tsx` instead of `components/ui/`. If you ever need it elsewhere, you'll duplicate it.
- `LiveIndicator` is defined inside `TodayHabits.tsx` — same problem.

### State Management: **7.5 / 10**
- Smart hybrid: Server Components fetch data → pass as props → Client Components own optimistic local state
- The optimistic update + rollback pattern in `handleToggle` is production-quality
- The `useRealtimeEntries` hook for Supabase Realtime is well-isolated
- **Issue:** Proliferation of `router.refresh()` calls (5+ in `TodayHabits.tsx`) — this refetches ALL server data on every toggle/edit/delete/archive/backfill. For a user with 20+ habits, this is a performance hazard.
- **Issue:** `useState(initialHabits)` + `useEffect(() => setHabits(initialHabits), [initialHabits])` is the "sync prop to state" anti-pattern — it can cause subtle desyncs. The `router.refresh()` → prop-change → effect cycle is fragile.
- No global state library (Zustand, Jotai) — acceptable for current scope, but will need one soon.

### Code Cleanliness: **8.5 / 10**
- Consistent `ok<T>()` / `err()` helper pattern in all API routes is very clean
- Good use of `satisfies HabitEntry` for type narrowing in the optimistic update
- `hexToRgba` utility defined inside `HabitForm.tsx` — should be in `lib/utils/colors.ts`
- Empty catch blocks (`catch { /* silently ignore */ }`) in `confirmDelete` — dangerous, at minimum should log

### Naming Conventions: **9 / 10**
Consistent, descriptive names throughout. `HabitWithEntry`, `HeatmapDay`, `ActivityItem`, `BackfillRow` — all self-documenting. No confusing abbreviations.

### Scalability: **7 / 10**
- **Per-toggle DB writes**: Every habit toggle triggers a `/api/entries` PATCH + `recalculateHabitStats()` (3 sequential queries). For a user logging 20 habits simultaneously, that's 60 DB round-trips.
- **Streak calculation in Node**: The `recalculateHabitStats` function fetches up to 400 entries, calculates streaks in JS, then writes back. This should be a PostgreSQL function (one already exists: `calculate_streak` in migration, but it's not called by the API).
- **`GET /api/habits` makes 3 DB queries** (habits + today entries + 30-day entries) — could be reduced to 1-2 with proper JOINs.

### Performance Bottlenecks: **7 / 10**
- ✅ All dashboard data fetched in parallel via `Promise.all()`
- ✅ `useMemo` used throughout `ProgressChart` and `InsightCards`
- ❌ `router.refresh()` on every interaction re-runs ALL server components (full RSC payload re-render)
- ❌ No `React.memo` on `HabitCard`, `HabitList`, `WeeklyOverview` — if habits array changes, entire list re-renders
- ❌ Google Fonts loaded unconditionally — should use `next/font` for optimal font loading strategy

### Unused Code / Overengineering
- `app/actions/todo-actions.ts` — a "todo" server action exists but seems unconnected to the habit tracker. Legacy file from project scaffolding.
- `supabase/migrations/002_add_todos.sql` — a `todos` table was added in migration 2, completely unrelated to habits. Should be removed or the feature built out.
- The PostgreSQL `calculate_streak()` function in the migration is never called by the application (streak is recalculated in JS instead).
- `SidebarPulse.tsx` (12KB) — unclear what this does vs. `Sidebar.tsx` (9KB). Potential duplication.

---

## 4. 🗄️ Backend / Database Review

### API Structure: **8 / 10**
- REST API following consistent patterns: `GET/POST` on collections, `PATCH/DELETE` on `[id]` routes
- Shared `ok<T>()` / `err()` response helpers in each route (slight duplication — should be in `lib/utils/api.ts` and imported)
- `safeErrorMessage()` utility prevents raw DB error messages from leaking to clients ✅
- Zod validation on all write endpoints ✅

### Security Issues: **7.5 / 10**
- ✅ RLS enabled on all 6 tables with proper `auth.uid() = user_id` policies
- ✅ Auth check (`if (!user) return err('Unauthorized', 401)`) at the top of every API route
- ✅ Middleware redirects unauthenticated users away from protected routes
- ⚠️ The habit ownership check in `/api/entries` PATCH (verifying `user_id` matches before upserting) is correct but adds an extra DB round-trip. The RLS policy on `habit_entries` already enforces this — the explicit check is redundant but not harmful.
- ⚠️ No rate limiting on any API route. A malicious authenticated user could spam `/api/entries` to DoS their own streak recalculation.
- ⚠️ `color` field in habits accepts any string — no validation that it's a valid hex color. Could store `javascript:alert(1)` style payloads if ever rendered as an `href`.
- ❌ No CSRF protection layer visible (though Next.js App Router's cookie-based Supabase auth provides some inherent protection).

### Authentication Flow: **8 / 10**
- ✅ `@supabase/ssr` properly used with cookie-based session management
- ✅ Middleware handles the session refresh lifecycle correctly
- ✅ The `try/catch` in middleware prevents crashes when env vars are missing (from conversation 18628eff)
- ⚠️ Middleware uses a shadow variable `url` that shadows the outer `process.env` `url` variable (lines 11 and 65) — confusing, could cause a bug if someone adds logic between them.
- ❌ No OAuth providers (Google, GitHub) — email/password only. In 2026, this is a significant signup friction point.

### Database Schema Quality: **9 / 10**
This is genuinely well-designed:
- `profiles` properly extends `auth.users` via FK + cascade delete
- `habit_entries` has `UNIQUE(habit_id, entry_date)` — prevents duplicate logs ✅
- `daily_moods` has `UNIQUE(user_id, entry_date)` ✅
- `frequency JSONB` for the flexible frequency system is the right call
- Proper indexes on all query patterns (`user_id + entry_date`, `habit_id + entry_date`)
- `streak_freeze_count` in profiles — good forward-thinking, but never surfaced in UI

**One concern:** `current_streak` and `total_completions` are denormalized onto the `habits` table. This is correct for read performance, but the write path (Node.js recalculation) can drift out of sync if multiple concurrent clients write entries for the same habit.

### Scalability for 10k+ Users: **7 / 10**
- The schema and indexes will handle 10k users fine at the database level.
- The `recalculateHabitStats` function fetches `.limit(400)` entries in Node, processes them, and writes back — at 10k users each with 20 habits, this becomes expensive. **Use the existing PL/pgSQL `calculate_streak()` function instead.**
- No caching layer anywhere (no Redis, no in-memory). The `/api/analytics/*` endpoints likely do expensive aggregations on every request.
- Supabase's free tier has connection pooling limits. At 10k+ concurrent users, you'll need to move to `pgBouncer` connection pooling (Supabase offers this in paid plans).

### Error Handling: **7.5 / 10**
- ✅ Try/catch on all API routes
- ✅ `safeErrorMessage()` prevents DB error message exposure
- ❌ Empty `catch {}` in `confirmDelete` in `TodayHabits.tsx` silently swallows errors
- ❌ `handleArchive` does a fire-and-forget `fetch` with no error handling at all — if archive fails, the UI removes the habit but the DB still has it
- ❌ No global error boundary in the React tree

### Validation Quality: **8.5 / 10**
- Zod schemas for habits and entries ✅
- Form validation via `react-hook-form` + `zodResolver` ✅
- Server-side Zod validation in API routes (client could lie) ✅
- `maxLength={1000}` on notes input, `maxLength={500}` on description ✅
- **Missing:** min/max on `target_value` (could a user enter -999999?)
- **Missing:** Validation that `frequency.days` has at least 1 day selected when type is `weekly`

---

## 5. 💰 Business Potential

### Can this become SaaS? **YES — strong fundamentals**
The multi-table schema, per-user RLS, category system, and rich analytics already support a SaaS model. You'd primarily need to add a billing layer.

### Monetization Ideas
| Tier | Price | Features |
|---|---|---|
| **Free** | ₹0 | 5 habits, 30-day history, basic stats |
| **Pro** | ₹299/mo | Unlimited habits, 1-year history, analytics, PDF export |
| **Elite** | ₹699/mo | AI coach, weekly email reports, streak freeze, priority support |
| **Teams** | ₹1,999/mo | Accountability groups, manager dashboard |

### Retention Ideas
- **Weekly digest email**: "Your week in numbers" — personalized Recharts chart embedded in email
- **Streak protection**: "Your 30-day streak is at risk! Tap here to log." push notification
- **Monthly achievement certificate**: Shareable PNG of completed month
- **Challenge mode**: 30-day challenges with leaderboard

### Viral Loops
- **Share streak card**: "I'm on a 30-day meditation streak 🔥" → Twitter/Instagram card with branding
- **Accountability partner invite**: "Join me in building better habits"
- **Public profile** (opt-in): `/u/mohan` shows your public streak board

### Why Users Will Leave
1. **No notifications** — out of sight, out of mind. #1 churn reason.
2. **Empty onboarding** — first 10 minutes determine retention forever
3. **No mobile app** — competitors (Streaks iOS app) own lock screen
4. **Free tier is undefined** — users don't know what they'll lose if they don't pay

---

## 6. 🚀 SEO / Launch Readiness

### Landing Page Quality: **4 / 10** ⚠️
The current `Hero.tsx` is a skeleton — single section with headline, subtitle, two CTAs, and 3 feature bullets. It is **not a conversion page**. Missing:
- Feature screenshots / demo video
- Testimonials / social proof numbers
- Comparison table vs. competitors
- FAQ section
- Pricing section
- Trust badges (Supabase, secure, privacy-first)

### SEO Score Estimate: **5 / 10**
- ✅ `<html lang="en">` — correct
- ✅ Root `metadata` object in `layout.tsx` with title + description + OpenGraph
- ❌ No `keywords` meta
- ❌ No `robots.txt`
- ❌ No `sitemap.xml`
- ❌ No structured data (JSON-LD for SoftwareApplication)
- ❌ The landing page has zero indexable body content (it's all client-rendered via React)
- ❌ `/dashboard`, `/login`, `/signup` should have `noindex` meta tags

### Trust Signals: **3 / 10**
- No pricing page
- No Terms of Service or Privacy Policy
- No "made with ❤️ by [Name]" — feels anonymous
- No user count or beta badge

### Product Hunt Readiness: **5 / 10**
- The product is feature-complete enough to launch
- **Blockers:** Landing page needs to be a proper conversion page, need a demo GIF/video, need a compelling tagline that's *not* "Your Personal Performance OS" (too generic)
- **Tagline suggestion:** *"The habit tracker that actually tracks."* or *"Build habits. Break records."*

### PWA Potential: **3 / 10**
- No `manifest.json` in `/public`
- No service worker
- No offline support
- No `theme-color` meta tag
- The app is fully functional as a PWA candidate — just needs the infrastructure

---

## 7. 🤖 Advanced Improvements

| Feature | Complexity | Impact |
|---|---|---|
| Push notifications (Web Push API) | Medium | 🔴 Highest — directly reduces churn |
| PWA manifest + service worker | Low | 🔴 High — "Add to homescreen" |
| Onboarding wizard (3-step) | Low | 🔴 High — #1 retention fix |
| AI habit coach (OpenAI API) | Medium | 🟠 High — premium differentiator |
| Weekly email digest (Resend/SendGrid) | Medium | 🟠 High — async re-engagement |
| Streak freeze feature | Low | 🟠 High — reduces churn on bad weeks |
| Accountability partner mode | High | 🟡 Medium — viral loop |
| Mood ↔ habit correlation chart | Low | 🟡 Medium — data already exists |
| Smart reminders (learns best time from completion data) | High | 🟠 High |
| Community mode / public leaderboards | Very High | 🟡 Medium |
| Habit templates library | Low | 🟠 High — reduces onboarding friction |
| CSV / PDF export | Low | 🟡 Medium — B2B / power users |
| Icon picker (visual, not text input) | Low | 🟡 Medium — UX polish |
| Gamification: XP / levels | Medium | 🟡 Medium — engagement loop |

---

## 8. 📊 Final Brutal Score

| Dimension | Score | Notes |
|---|---|---|
| **UI Design** | 7.5/10 | Premium dark theme, professional tokens, but landing page is thin |
| **UX** | 6/10 | Onboarding is near-zero; empty states need work; too much for new users |
| **Code Quality** | 8/10 | Clean, typed, well-structured; some anti-patterns in state sync |
| **Scalability** | 7/10 | DB is solid; Node-side streak calc and router.refresh() spam will hurt at scale |
| **Monetization Potential** | 8/10 | Strong SaaS foundation; just needs billing and tier definitions |
| **Launch Readiness** | 5/10 | Missing landing page, onboarding, notifications, and PWA |
| **Premium Feel** | 7.5/10 | Dashboard feels premium; icon-as-text-input and no visual polish on hero breaks illusion |
| **Overall** | **7.0/10** | A genuinely impressive solo/small-team build. Production-capable backend, thoughtful schema. UX needs a sprint before public launch. |

---

## 9. 🗺️ Action Plan

### 🔴 Top 10 Urgent Fixes (Do This Week)

1. **Build a proper landing page** — Add hero screenshot/demo GIF, feature section, pricing table, testimonials, FAQ. This is your #1 conversion asset.
2. **Add onboarding wizard** — 3-step modal on first login: "What do you want to build?" → select habit templates → first check-in celebration.
3. **Wire up push notifications** — The `reminder_time` field already exists in the DB. Integrate Web Push or a service like OneSignal.
4. **Add `manifest.json` + service worker** — Makes the app installable. Takes 1 hour with `next-pwa`.
5. **Fix `handleArchive` fire-and-forget** — Add `await` and error handling. Silent failure is a data integrity bug.
6. **Replace icon text input with a visual picker** — A grid of 30 Lucide icons as clickable buttons. The current UX is developer-facing, not user-facing.
7. **Use the existing `calculate_streak()` PL/pgSQL function** — Replace the Node.js streak recalculation. Reduces 3 queries to 1 DB call per toggle.
8. **Add `robots.txt` and `sitemap.xml`** — Basic SEO hygiene. Can be auto-generated with Next.js route handlers.
9. **Add PrivacyPolicy + Terms of Service pages** — Required before any real users. Kills trust if absent.
10. **Add rate limiting to API routes** — Use `@upstash/ratelimit` or Vercel's built-in edge rate limiting.

### 🟠 Top 10 Premium Upgrades (Next Sprint)

1. **AI Habit Coach** — "Based on your completion patterns, you do best on Thursdays. Want to shift your gym habit to Thursday morning?" — GPT-4o with 90-day context.
2. **Weekly email digest** — Recharts chart rendered to PNG → embedded in Resend email template. "Last week: 78% completion. Your best week ever."
3. **Streak Freeze UI** — Surface the existing `streak_freeze_count` field. Users can protect one streak per month.
4. **Mood ↔ Habit Correlation Chart** — Use the existing `daily_moods` table. "On days you meditate, your mood score averages 4.2/5 vs 2.8/5 on days you skip."
5. **Share Streak Card** — `<canvas>` rendered PNG with habit name, streak count, and HabitForge branding. Twitter-card ready.
6. **Habit Templates Library** — 20 pre-built habits (Morning routine, Workout, Reading, etc.) with icons/colors/targets pre-filled. Kills onboarding friction.
7. **Real-time Leaderboard** — Opt-in streak leaderboard. Pure retention mechanism.
8. **Vertical "habit journal" view** — Tap a habit → see its full 365-day calendar + notes history. Deeper engagement with individual habits.
9. **Google / GitHub OAuth** — Add social login. Reduces signup friction by ~40%.
10. **Exportable PDF report** — Monthly or yearly performance report. Great for coaches/accountability partners.

### How to Make This Look Like a ₹10 Crore Startup Product

1. **Landing page that converts** — Add a live demo mode (no sign-up required, uses seed data). Let users feel the product before committing. This alone can 3x conversion.
2. **Brand identity** — HabitForge needs a logo, a consistent color in marketing materials, and a visual identity beyond just the app. Add a logo SVG to the Navbar and landing page.
3. **Social proof** — Even if fake for beta: "Join 1,200 builders tracking 8,400 habits daily." Build trust before you have it.
4. **Product screenshots in the hero** — Show the actual dark dashboard. People buy what they can see themselves using.
5. **Testimonials section** — Get 5 friends to write quotes. Real photos. Real names. This is the #1 trust signal for unknown brands.
6. **Micro-animations on the landing page** — Animate the feature tiles, add a scroll-reveal effect on sections, animate numbers counting up. Framer Motion is already installed.
7. **Changelog / "What's New" page** — Signals the product is alive and improving. Even a simple `/changelog` page with markdown entries creates developer trust.
8. **Define and enforce a pricing tier** — Free users with 5 habits, Pro users with unlimited. This creates upgrade pressure without being annoying.
9. **Support chat widget** — Crisp or Intercom free tier. A "Chat with us" button signals real humans are behind the product.
10. **Product Hunt launch kit** — First comment strategy, Hunter > 1k followers, launch on a Tuesday, prepare Product Hunt-specific hero GIF (600×450px). Document the story: "Solo builder, built in X weeks, here's the stack."

---

*Audit conducted: April 28, 2026 · Codebase commit: ~16 Apr 2026*
