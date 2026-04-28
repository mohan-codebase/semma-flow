# HabitForge — Bug Fix Sprint Prompt (Antigravity IDE)

> Paste this entire document into a new Antigravity agent task.
> The agent should execute tasks **in order** and **stop for confirmation** where indicated.
> Each task is self-contained and independently verifiable.

---

## 0 · Project context

**Stack**

- Next.js `16.2.4` (App Router, Turbopack)
- React `19.2.4`
- TypeScript `5`
- Tailwind CSS `v4` (PostCSS plugin)
- Supabase (`@supabase/ssr` + `@supabase/supabase-js`) for auth, Postgres, Realtime
- `react-hook-form` + `zod` for forms / validation
- `date-fns`, `date-fns-tz` for time
- `recharts`, `framer-motion`, `lucide-react`, `@hello-pangea/dnd` for UI

**Domain**

Personal habit tracker. Per-user habits, daily entries, streaks, moods, achievements. RLS enforced on every user-owned table (`profiles`, `categories`, `habits`, `habit_entries`, `daily_moods`, `achievements`).

**Repo layout (relevant)**

```
app/
  api/                    # Route handlers (entries, habits, analytics, …)
  dashboard/              # Authed pages
  layout.tsx, page.tsx    # Landing + global shell
components/
  dashboard/, habits/, analytics/, ui/, landing/, layout/
lib/
  supabase/{client,server}.ts
  hooks/useRealtimeEntries.ts
  validations/{habit,entry}.ts
  utils/{dates,api,url}.ts
supabase/migrations/      # 001_initial_schema.sql, 002_add_todos.sql
proxy.ts                  # ⚠️ should be middleware.ts (see Task 2)
next.config.ts
```

---

## 1 · Ground rules

- **Do not run `npm run dev`** unless a task explicitly says so. Historical issue: stray `/Users/mohan/package-lock.json` caused Turbopack to mis-detect workspace root and enter an infinite resolver-error loop. Mitigation already shipped in `next.config.ts` (`turbopack.root`).
- After **every** task, run `npx tsc --noEmit` and resolve any new errors before committing.
- Read `node_modules/next/dist/docs/` before using a Next.js API you are unsure of. This Next version may differ from training data — heed deprecations.
- **No new dependencies** unless a task names them.
- **No new files** unless a task specifies a path.
- Preserve existing code style (function components, named exports, inline `style={{ … }}` is acceptable, do not rewrite to Tailwind classes).
- One commit per completed task. Commit message format: `fix(scope): one-line summary`. Co-author yourself via the existing repo convention.
- **Never skip git hooks.** Never `--force-push`. Never amend a previous commit; create a new one.
- If any task is blocked (missing context, ambiguous spec, destructive op needs confirmation), **stop and report**. Do not guess.

---

## 2 · Task list (execute in order)

| # | Severity | Title |
|---|----------|-------|
| 1 | P0 | Rotate and remove leaked OAuth client secret |
| 2 | P0 | Rename `proxy.ts` → `middleware.ts` |
| 3 | P0 | Delete duplicate `utils/supabase/` scaffold |
| 4 | P1 | Fix optimistic-toggle revert on `/dashboard/habits` |
| 5 | P1 | Fix `weekPercentage` denominator on dashboard |
| 6 | P1 | Add `REPLICA IDENTITY FULL` migration for realtime DELETE |
| 7 | P1 | Fix `early_bird` achievement timezone bug |
| 8 | P1 | Pin `lucide-react` to a real version |
| 9 | P1 | Replace `.single()` with `.maybeSingle()` for nullable lookups |
| 10 | P2 | Batch `achievements/check` queries |
| 11 | P2 | Drop redundant `profiles` upserts in API routes |
| 12 | P2 | Memoize heatmap input arrays |
| 13 | P2 | Move data export to `/api/export` route |
| 14 | P3 | Add `lint` and `typecheck` npm scripts |
| 15 | P3 | Remove `tsconfig.tsbuildinfo` from git, gitignore it |
| 16 | P3 | Replace boilerplate `README.md` |
| 17 | P3 | Add pagination / "Show all" to Recent Entries |
| 18 | P3 | Resolve Settings "Delete Account" misleading label |

---

## Task 1 — Rotate and remove leaked OAuth client secret  ·  P0

**File:** `client_secret_660042141605-a3vpnl78df0u00jpqsv0sfh813asd84p.apps.googleusercontent.com.json` (repo root).

**Background:** A Google OAuth client secret is committed to the repository. If the repo is or has ever been public, treat the secret as compromised.

**Steps**

1. **Stop and prompt the user.** Print verbatim:
   > "OAuth client secret is committed to this repo. Before I delete it, you must rotate the secret in Google Cloud Console → APIs & Services → Credentials, and confirm the new secret is wired up via environment variables. Reply `rotated` to continue, or `skip` to proceed without rotation (NOT RECOMMENDED)."
2. Wait for confirmation. Do not proceed on any other reply.
3. Delete the JSON file from the working tree.
4. Add to `.gitignore`:
   ```
   client_secret_*.json
   ```
5. Verify no code imports the file:
   ```bash
   grep -rn "client_secret_" --include="*.ts" --include="*.tsx" --include="*.json" .
   ```
   If any non-ignored matches found, abort and report.

**Acceptance**

- File removed from working tree.
- `.gitignore` updated.
- `git ls-files | grep client_secret` returns empty.
- `npx tsc --noEmit` passes.

**Commit:** `fix(security): remove leaked Google OAuth client secret from repo`

---

## Task 2 — Rename `proxy.ts` → `middleware.ts`  ·  P0

**File:** `proxy.ts` (repo root).

**Background:** Next.js requires the middleware module to be named `middleware.ts` at the project root (or `src/middleware.ts`). The current `proxy.ts` is never invoked. Effects:

- Edge auth refresh never runs → Supabase access token never rotates → users get `401 Unauthorized` on long-lived sessions.
- The redirect rules in `proxy.ts` (`/login` for unauth, `/dashboard` for auth on landing) are entirely dead — the protection comes only from server pages calling `createServerClient().auth.getUser()` themselves.

**Steps**

1. `git mv proxy.ts middleware.ts`. Do **not** modify contents in this commit.
2. Run `npx tsc --noEmit`.
3. Manually inspect the existing `config.matcher` regex to confirm coverage:
   ```ts
   matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
   ```
   Confirm this excludes static assets and includes all auth-gated paths.

**Acceptance**

- `middleware.ts` exists at repo root, `proxy.ts` does not.
- `npx tsc --noEmit` passes.
- No code references `'@/proxy'` or relative `./proxy`.

**Commit:** `fix(auth): rename proxy.ts to middleware.ts so Next runs the auth gate`

---

## Task 3 — Delete duplicate `utils/supabase/` scaffold  ·  P0

**Files:**

- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/middleware.ts`

**Background:** App code uses `lib/supabase/{client,server}.ts`. The `utils/supabase/*` files are leftover scaffold. Worse, `utils/supabase/middleware.ts:24` drops the `options` argument when calling `request.cookies.set(name, value)` (signature is `set(name, value, options)`), and the function never calls `supabase.auth.getUser()` to refresh the session. If somebody wires it up later by mistake, sessions break silently.

**Steps**

1. Verify zero imports:
   ```bash
   grep -rn "from '@/utils/supabase\|from \"\\@/utils/supabase\|from '\\.\\./utils/supabase\|from '\\./utils/supabase" \
     app components lib --include="*.ts" --include="*.tsx"
   ```
   Must return empty.
2. Delete the three files. Remove the now-empty `utils/supabase/` directory and `utils/` if empty.
3. `npx tsc --noEmit`.

**Acceptance**

- Files gone.
- Type-check passes.

**Commit:** `chore(supabase): remove unused utils/supabase scaffold (duplicates lib/supabase)`

---

## Task 4 — Fix optimistic-toggle revert on `/dashboard/habits`  ·  P1

**File:** `app/dashboard/habits/page.tsx`, function `handleToggle` (~line 304).

**Bug:** Current code performs an optimistic state mutation, then `await fetch(...)` and **never checks `res.ok`**. A failed PATCH leaves the UI showing the wrong state. Compare with `components/dashboard/TodayHabits.tsx` `handleToggle` which reverts correctly.

**Required behavior**

1. Snapshot `prev.todayEntry` (or `null`) for the affected habit before mutating.
2. Apply optimistic update.
3. `await` the fetch. If `!res.ok` or fetch throws:
   - Revert local state to the snapshot for that habit only.
   - Surface a toast: import `useToast` from `@/components/ui/Toast` and call `toast('Failed to save. Try again.', 'error')`.
4. On success, parse the response (`{ data: HabitEntry }`) and replace the optimistic entry with the server-returned entry so generated fields (`id`, `created_at`, `completed_at`, `updated_at`) are correct.

**Acceptance**

- Read the file after the change. The handler must:
  - Capture a snapshot before mutation.
  - Branch on `res.ok`.
  - Revert on failure.
  - Replace optimistic with server entry on success.
- `npx tsc --noEmit` passes.

**Commit:** `fix(habits): revert optimistic toggle on /dashboard/habits when PATCH fails`

---

## Task 5 — Fix `weekPercentage` denominator on dashboard  ·  P1

**File:** `app/dashboard/page.tsx`, function `fetchOverviewStats` (~lines 75–77).

**Bug:**

```ts
const weekTotal = (weekEntries ?? []).length;
const weekCompleted = (weekEntries ?? []).filter((e) => e.is_completed).length;
const weekPercentage = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
```

`weekTotal` counts entry rows. A user who only logs days they completed a habit will see `weekPercentage === 100` permanently.

**Fix**

Use `habits.length * 7` as the denominator. Cap at 100. Edge case: zero habits → return 0.

```ts
const habitCount = habits.length;
const weekCompleted = (weekEntries ?? []).filter((e) => e.is_completed).length;
const weekDenom = habitCount * 7;
const weekPercentage = weekDenom > 0 ? Math.min(100, Math.round((weekCompleted / weekDenom) * 100)) : 0;
```

Note: this assumes daily frequency for all habits. Document the simplification in a comment near the calculation. A future task can incorporate per-habit `frequency.type`.

**Acceptance**

- With 3 habits and 5 completed entries in the last 7 days, `weekPercentage === Math.round(5/21*100) === 24`.
- With 0 habits, no division-by-zero, returns 0.
- `npx tsc --noEmit` passes.

**Commit:** `fix(dashboard): use habitCount*7 as weekPercentage denominator`

---

## Task 6 — Add `REPLICA IDENTITY FULL` migration for realtime DELETE  ·  P1

**New file:** `supabase/migrations/003_replica_identity_full.sql`.

**Background:** `lib/hooks/useRealtimeEntries.ts:44-46` reads `payload.new ?? payload.old` and filters by `entry_date`. Postgres logical replication emits only the primary key in `OLD` for DELETE unless `REPLICA IDENTITY FULL` is set. DELETE events are silently dropped from the realtime UI.

**Migration content (verbatim)**

```sql
-- 003_replica_identity_full.sql
-- Enable full OLD row payload for habit_entries DELETE events so realtime
-- consumers can filter by entry_date. Slightly increases WAL volume; acceptable
-- for the row volume on this table.
ALTER TABLE public.habit_entries REPLICA IDENTITY FULL;
```

**Acceptance**

- File created with the content above.
- Do **not** apply via psql or CLI here. Migration is applied by the user via Supabase CLI / dashboard.

**Commit:** `fix(realtime): add REPLICA IDENTITY FULL migration for habit_entries DELETE`

---

## Task 7 — Fix `early_bird` achievement timezone bug  ·  P1

**File:** `app/api/achievements/check/route.ts`, the `early_bird` block (~line 194 onward).

**Bug:**

```ts
const noonStr = `${dateStr}T12:00:00`;
const { count } = await supabase
  .from('habit_entries')
  .select('*', { count: 'exact', head: true })
  …
  .lt('completed_at', noonStr);
```

`noonStr` has no timezone offset. Compared against a `TIMESTAMPTZ` column, Postgres interprets the literal in the **server** timezone (Supabase region), unrelated to the user. Achievement triggers inconsistently.

**Fix**

1. Load the user's `profiles.timezone` (fallback `'Asia/Kolkata'`).
2. Compute the user-local noon for each `dateStr` and convert to a UTC ISO string before filtering. Use `date-fns-tz` (already in `package.json`):
   ```ts
   import { fromZonedTime } from 'date-fns-tz';
   const noonUtcIso = fromZonedTime(`${dateStr} 12:00:00`, userTz).toISOString();
   ```
3. Audit the rest of the file for similar patterns (`completed_at` compared against a string). Apply the same fix.

**Acceptance**

- A user in `America/New_York` who completes all habits at 11:30 ET counts as early-bird; at 12:30 ET does not, regardless of Supabase server region.
- `npx tsc --noEmit` passes.

**Commit:** `fix(achievements): use user timezone for early_bird noon cutoff`

---

## Task 8 — Pin `lucide-react` to a real version  ·  P1

**File:** `package.json`.

**Bug:** Dependency is `"lucide-react": "^1.8.0"`. Lucide-react is published with zero-leading majors (`0.4xx`, `0.5xx`). Whatever resolved on disk may be wrong.

**Steps**

1. Run and record output:
   ```bash
   npm ls lucide-react
   npm view lucide-react version
   ```
2. Update `package.json` to the latest stable `0.x` (use the value reported by `npm view lucide-react version`):
   ```json
   "lucide-react": "^<latest-0.x>"
   ```
3. `npm install`.
4. The codebase imports the following icons. Verify each still exists in the new version:
   `Plus`, `CalendarClock`, `Flame`, `CheckCircle2`, `Target`, `Calendar`, `TrendingUp`, `Clock`, `User`, `Bell`, `Download`, `Trash2`, `LogOut`, `Save`, `ChevronRight`, `Zap`, `ChevronDown`, `ChevronUp`, `Check`, `LayoutGrid`, `List`, `ArrowLeft`.
   Run:
   ```bash
   for icon in Plus CalendarClock Flame CheckCircle2 Target Calendar TrendingUp Clock User Bell Download Trash2 LogOut Save ChevronRight Zap ChevronDown ChevronUp Check LayoutGrid List ArrowLeft; do
     test -f "node_modules/lucide-react/dist/esm/icons/${icon,,}.js" || echo "MISSING: $icon"
   done
   ```
   (Path may vary; use the actual export check via a quick `grep` in `node_modules/lucide-react/dist/lucide-react.d.ts` if needed.)
5. `npx tsc --noEmit`.

**Acceptance**

- `npm ls lucide-react` reports a `0.x` version.
- All icon imports resolve.
- Type-check passes.

**Commit:** `fix(deps): pin lucide-react to ^0.x (was nonexistent ^1.8.0)`

---

## Task 9 — Replace `.single()` with `.maybeSingle()` for nullable lookups  ·  P1

**Files:**

- `app/api/categories/route.ts` (~line 54): `.limit(1).single()` for max sort_order.
- `app/api/habits/route.ts` (~line 106): same pattern.

**Bug:** `.single()` returns a `PGRST116` error when zero rows match. The code tolerates this because it reads `maxRow?.sort_order ?? -1`, but Supabase logs the error. Use `.maybeSingle()` to express intent and silence noise.

**Steps**

1. In both files, replace `.limit(1).single()` with `.limit(1).maybeSingle()`.
2. Audit the file for any other `.single()` usage where zero rows is a valid outcome and convert similarly. Do **not** convert `.single()` calls where exactly one row is required (e.g., post-insert `.select().single()`).
3. `npx tsc --noEmit`.

**Acceptance**

- The two known sites are converted.
- Insert/update `.select().single()` calls are unchanged.
- Type-check passes.

**Commit:** `fix(api): use maybeSingle for nullable max-sort_order lookups`

---

## Task 10 — Batch `achievements/check` queries  ·  P2

**File:** `app/api/achievements/check/route.ts`.

**Bug:** ~50 sequential round trips:

- `perfect_week`: 7 (one per day)
- `perfect_month`: 30
- `early_bird`: 7
- `comeback_kid`: 2 per habit

**Refactor**

1. Fetch the last **30 days** of entries for the user in **one** query, including `entry_date`, `is_completed`, `habit_id`, `completed_at`.
2. Group by `entry_date` in JS to compute `perfect_week` (last 7 unique dates with completion count == habit count) and `perfect_month` (last 30).
3. For `early_bird`, partition the 7-day slice by `entry_date`, count per-day entries with `completed_at < user-local-noon-utc` (use the same helper from Task 7). Achievement unlocks if every one of the last 7 days has count == habit count.
4. For `comeback_kid`, replace the per-habit double query with: fetch entries for habits with `current_streak >= 7`, ordered by `entry_date`, walk in JS to confirm gap and prior activity.
5. Preserve identical unlock semantics. Do not change which achievements unlock, only the query path.

**Acceptance**

- Round-trip count for a typical case (10 habits, 30-day history) drops from ~50 to ≤ 8.
- All achievement types still unlock at the same thresholds. Verify by manual reasoning over the new code; no schema changes.
- `npx tsc --noEmit` passes.

**Commit:** `perf(achievements): batch 30-day fetch, eliminate ~45 round trips in check route`

---

## Task 11 — Drop redundant `profiles` upserts in API routes  ·  P2

**Files:**

- `app/api/habits/route.ts` (~line 97): `await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' });`
- `app/api/moods/route.ts` (~line 50): same pattern.
- `app/api/categories/route.ts` (~line 46): same pattern.

**Background:** The `handle_new_user()` trigger in `supabase/migrations/001_initial_schema.sql:194` already creates a `profiles` row on `auth.users` insert. Re-upserting on every API write is redundant.

**Steps**

1. Remove the upsert call in each of the three sites.
2. `npx tsc --noEmit`.

**Acceptance**

- The three upsert calls are gone.
- Type-check passes.

**Commit:** `perf(api): drop redundant profiles upsert (handled by handle_new_user trigger)`

---

## Task 12 — Memoize heatmap input arrays  ·  P2

**Files:**

- `components/analytics/CalendarHeatmap.tsx`
- Callers passing the `data` prop (notably `app/dashboard/habits/[id]/page.tsx`).

**Bug:** `CalendarHeatmap`'s top-level `useMemo` is keyed on the `data` reference. Callers compute `entryHeatmap` and `heatmapData` inline on every render, producing a new array each time and invalidating the memo.

**Fix**

In each caller, wrap derived heatmap arrays in `useMemo`:

```ts
const entryHeatmap = useMemo<HeatmapCell[]>(
  () => (habit?.entries ?? []).map((e) => ({
    date: e.entry_date,
    count: e.is_completed ? 1 : 0,
    percentage: e.is_completed ? 100 : 0,
  })),
  [habit?.entries]
);

const heatmapData = useMemo<HeatmapCell[]>(
  () => (heatmap.length > 0 ? heatmap : entryHeatmap),
  [heatmap, entryHeatmap]
);
```

**Acceptance**

- Heatmap arrays are memoized at the call site.
- Visual output identical.
- `npx tsc --noEmit` passes.

**Commit:** `perf(analytics): memoize heatmap input arrays to keep CalendarHeatmap useMemo valid`

---

## Task 13 — Move data export to `/api/export` route  ·  P2

**Files:**

- New: `app/api/export/route.ts`.
- Edit: `app/dashboard/settings/page.tsx` (`handleExportJSON`, `handleExportCSV`).

**Background:** Export currently runs four Supabase queries from the browser using the user's session. RLS keeps it safe, but server-side aggregation is faster, allows future rate-limiting, and consolidates the data shape.

**Spec**

`GET /api/export?format=json|csv`

- Authenticate via `createServerClient().auth.getUser()`.
- For `json`: return `{ exportedAt, habits, entries, moods }` with `Content-Type: application/json` and `Content-Disposition: attachment; filename="habitforge-export-<YYYY-MM-DD>.json"`.
- For `csv`: stream the entries with columns `habit_name,entry_date,is_completed,value,notes`. Same headers, `text/csv` content type. Properly escape commas and quotes.
- Reject any other `format` value with `400`.

Update the settings page to call `/api/export?format=json` and `/api/export?format=csv` and trigger a download from the response blob. Remove the direct Supabase queries from the client.

**Acceptance**

- Export buttons in Settings produce identical files (compare a sample export before and after).
- `npx tsc --noEmit` passes.

**Commit:** `refactor(export): move data export from client to /api/export route`

---

## Task 14 — Add `lint` and `typecheck` npm scripts  ·  P3

**File:** `package.json`.

**Steps**

1. Add to `scripts`:
   ```json
   "lint": "next lint",
   "typecheck": "tsc --noEmit"
   ```
2. Run both once and resolve any failures introduced. (Pre-existing failures: report them, do not fix in this task.)

**Acceptance**

- `npm run typecheck` exits 0.
- `npm run lint` exits 0 OR existing warnings/errors are reported in the commit body.

**Commit:** `chore(scripts): add lint and typecheck npm scripts`

---

## Task 15 — Remove `tsconfig.tsbuildinfo` from git, gitignore it  ·  P3

**Files:** `tsconfig.tsbuildinfo`, `.gitignore`.

**Steps**

1. `git rm --cached tsconfig.tsbuildinfo`.
2. Append to `.gitignore`:
   ```
   *.tsbuildinfo
   ```
3. `npx tsc --noEmit` (regenerates the file locally; it's now ignored).

**Acceptance**

- `git ls-files | grep tsbuildinfo` is empty.
- `.gitignore` contains the new line.

**Commit:** `chore(git): stop tracking tsconfig.tsbuildinfo`

---

## Task 16 — Replace boilerplate `README.md`  ·  P3

**File:** `README.md`.

**Replace contents with:**

```markdown
# HabitForge

Personal habit tracker. Track daily habits, build streaks, log moods, surface analytics. Single-user-per-account, RLS-enforced data isolation.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind v4 · Supabase (auth + Postgres + Realtime) · Recharts · Framer Motion.

## Local development

Prerequisites: Node 20+, a Supabase project.

```bash
cp .env.example .env  # fill SUPABASE_URL and SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Database

Migrations live in `supabase/migrations/`. Apply via Supabase CLI:

```bash
supabase db push
```

## Scripts

- `npm run dev` — local dev server (Turbopack)
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `next lint`

## Architecture notes

- Auth + edge guard: `middleware.ts` (renamed from `proxy.ts`).
- Server data: `lib/supabase/server.ts` via `@supabase/ssr`.
- Client data: `lib/supabase/client.ts`.
- Realtime: `lib/hooks/useRealtimeEntries.ts`.
- All user-owned tables use RLS with `auth.uid() = user_id`.
```

**Acceptance**

- README replaced with project-specific content.

**Commit:** `docs(readme): replace create-next-app boilerplate with project README`

---

## Task 17 — Add pagination / "Show all" to Recent Entries  ·  P3

**File:** `app/dashboard/habits/[id]/page.tsx`.

**Background:** Recent Entries hard-codes `.slice(0, 20)`. With editing now wired (modal opens on row click), older entries cannot be edited from this page.

**Spec**

- Default render: first 20 entries.
- Below the list, render a "Show all (N)" button when more entries exist.
- Clicking expands to all entries from `habit.entries`.
- A second click ("Show fewer") collapses back to 20.
- Maintain scroll position when toggling.

**Acceptance**

- Toggle works.
- All entries are clickable and editable.
- `npx tsc --noEmit` passes.

**Commit:** `feat(habit-detail): add show-all toggle for Recent Entries`

---

## Task 18 — Resolve Settings "Delete Account" misleading label  ·  P3

**File:** `app/dashboard/settings/page.tsx`.

**Background:** The button labeled `Delete Account` only signs the user out (line ~426). The inline comment admits this. Either implement true deletion or rename the button.

**Pick option B (safer)**

1. Rename the button to `Sign out everywhere`.
2. Remove the `DELETE` confirmation input and the surrounding "Danger Zone" framing; merge with the existing Sign-Out card or keep as a secondary card titled "Session".
3. Adjust copy: "Sign out of all sessions on every device."
4. Action: call `supabase.auth.signOut({ scope: 'global' })`.
5. If the user genuinely wants account deletion later, file a follow-up.

**Acceptance**

- No button mislabels its action.
- `npx tsc --noEmit` passes.

**Commit:** `fix(settings): replace fake Delete Account with global Sign Out`

---

## 3 · Verification checklist (run after all tasks)

```bash
npm run typecheck
npm run lint
git ls-files | grep -E 'client_secret_|tsbuildinfo' && echo "FAIL"  || echo "OK"
test -f middleware.ts && ! test -f proxy.ts && echo "OK middleware" || echo "FAIL middleware"
test ! -d utils/supabase && echo "OK utils removed" || echo "FAIL utils still present"
```

All five lines should report `OK` (or empty + `OK`).

## 4 · Out of scope (do not touch)

- The Supabase migrations 001 and 002 schemas (only adding 003 in Task 6).
- The CSP in `next.config.ts`.
- Visual / styling redesign.
- Account deletion implementation (Task 18 explicitly avoids it).
- Test infrastructure (no test runner is installed; flag only, do not add).

## 5 · When done

Open a single PR titled:

> `Bug-fix sprint: P0 security + P1 correctness + P2 perf`

Include in the PR body:

- The task table from §2 with each row marked ✅ or ⏭ (skipped, with reason).
- Output of the verification checklist from §3.
- Any follow-ups discovered (link as TODOs, do not fix in this PR).
