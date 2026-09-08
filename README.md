# RIXZA Finance OS

**The Financial Command Center for RIXZA.** A pilotage layer on top of the
numbers — not an accounting system. It turns financial data into management
decisions: `DATA → CONTEXT → INSIGHT → DECISION`.

> Know your numbers. Control your business.

---

## What's in this build

| Area | Status |
| --- | --- |
| Next.js 16 · React 19 · Tailwind v4 · TypeScript · French UI · FCFA (XAF) | ✅ |
| **Record-level data model** — clients, subscriptions, invoices, payments, expenses, recurring costs, budget, goals | ✅ (`lib/finance/types.ts`) |
| **Derivation engine** — monthly figures + MRR waterfall + cash balance + P&L computed from the records, never typed by hand | ✅ (`lib/finance/derive.ts`) |
| Command Center dashboard, each block with a "Comment c'est calculé" panel | ✅ (`app/(app)/command-center`) |
| **RIXZA Financial Health Score** (0–100, 9 weighted components) on the Command Center | ✅ (`lib/finance/health.ts`) |
| **Chiffre d'affaires** — by month / client / service / country / type | ✅ (`/revenue`) |
| **Factures** — invoice + payment CRUD, AR metrics, auto-overdue | ✅ (`/invoices`) |
| **Clients** — portfolio table + per-client financial profile | ✅ (`/clients`, `/clients/[id]`) |
| **Dépenses** — expense + recurring-cost CRUD, per-category breakdown | ✅ (`/expenses`) |
| **Compte de résultat** — full monthly P&L | ✅ (`/pnl`) |
| **Données** — company, subscriptions, one-off revenue, budget, goals | ✅ (`/data`) |
| Accounts with roles (owner / admin / viewer), edit gated to OWNER·ADMIN·FINANCE, server-enforced (403) | ✅ (`lib/auth`) |
| Signed-cookie login with no backend, sign-out, global "+" quick-add | ✅ |
| Blank slate — no fictitious data; every screen prompts for real input | ✅ |
| Supabase schema/RLS present but the record model is not wired to it yet | ⏳ (`supabase/`) |
| AI Financial Analyst / Insights (§25–§27), Forecast, Scenarios, KPIs, Analytics, Unit Economics, Vendors, Accounts, Transactions, Reports, Audit log, Cmd+K | Not built |

### How the numbers are derived

Records → `lib/finance/derive.ts#deriveDataset()` → monthly `FinanceDataset` →
`buildSnapshot()` → Command Center. Key rules:

- **MRR** for a month = Σ subscription amounts active that month. The
  waterfall (new / expansion / contraction / churn) is the month-over-month
  diff of per-client MRR.
- **COGS / opex / taxes** split each expense (and monthly-equivalent of each
  recurring cost) by its `isCogs` flag and category.
- **Cash balance** = opening cash + Σ(payments − expenses) since the opening
  date.
- **Invoices** past their due date and still unpaid are promoted to
  `overdue` automatically.
- **Goals** show a live `current` derived from the metric (mrr, arr, cash…).

---

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see "Data layer" below
npm run dev
```

Open <http://localhost:3000>. You land on `/login`.

**Default accounts (seed mode), password `rixza`:**

| Compte | Rôle | Peut saisir les données |
| --- | --- | --- |
| `owner@rixza.local` | OWNER | oui |
| `admin@rixza.local` | ADMIN | oui |
| `viewer@rixza.local` | VIEWER | non (lecture seule) |

Override with `APP_AUTH_USERS="email:pass:ROLE,…"` (or single-user
`APP_AUTH_EMAIL`/`APP_AUTH_PASSWORD`/`APP_AUTH_ROLE`). Set
`APP_SESSION_SECRET` before deploying.

After signing in you land on `/command-center`. **It starts empty** — no
fictitious data. An OWNER/ADMIN/FINANCE user opens **Données** in the
sidebar and enters RIXZA's real figures (months, clients, invoices,
budget, goals); the dashboard fills in immediately and can be updated
anytime.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

---

## Data layer

The app talks only to the `FinanceStore` interface (`lib/data/store.ts`).

- **No env vars** → `SeedStore` serves `data/dataset.local.json` if it
  exists (written by the **Données** form, `PUT /api/dataset`), otherwise
  the bundled `data/seed.ts`.
- **`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set** →
  `SupabaseStore` reads the consolidated dataset from Postgres, and the
  Données form becomes read-only.

### The Données form

`/data` renders `DataEditor` (client) over the current dataset. Save →
`PUT /api/dataset` → validated by `lib/data/validate.ts` → written to
`data/dataset.local.json` (gitignored) → `revalidatePath("/", "layout")`
so the Command Center updates on the next view. "Réinitialiser" →
`DELETE /api/dataset` restores the bundled seed.

### Auth

`proxy.ts` runs on every request. Seed mode: it verifies a signed
(`HMAC-SHA256`, Web Crypto) session cookie set by `POST /api/auth/login`;
missing → pages redirect to `/login`, API calls get `401`. Supabase mode:
it refreshes and checks the Supabase session instead. `getCurrentUser()`
(`lib/auth/current-user.ts`) reads the signed-in user in Server
Components. Sign-out is in the top bar (`POST /api/auth/logout`).

### Standing up Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
3. Run `supabase/seed.sql` — it only inserts the company row (no fake data).
4. Create your auth user, then attach a membership:
   ```sql
   insert into memberships (company_id, user_id, role)
   values ('11111111-1111-1111-1111-111111111111', '<your-auth-uid>', 'owner');
   ```
5. Fill `.env.local` and restart.

Row Level Security scopes every query by `company_id` and role
(`owner > admin > finance > manager > viewer`, master prompt §34): all
members read; `finance`+ writes; `admin`+ deletes.

---

## Architecture

```
app/
  (app)/                 authenticated shell (sidebar + topbar)
    command-center/       the executive dashboard
    data/                 the "Données" input form (OWNER/ADMIN/FINANCE)
    settings/             session, workspace, accounts & roles
  api/
    auth/login·logout/    seed-mode credential auth
    dataset/              GET (all) · PUT/DELETE (editors only, 403 otherwise)
  login/                  sign-in (local credentials or Supabase)
  page.tsx                → redirect to /command-center
proxy.ts                  session refresh + auth gate (both modes)

components/
  ui/                    design-system primitives (Card, Metric, Delta, …)
  shell/                  Sidebar (role-filtered), Topbar, nav-items
  command-center/         dashboard blocks + method.tsx (formula panels)
  data/                   DataEditor form

lib/
  finance/                pure engine — types, metrics, format, snapshot, briefing
  auth/                   local credential config, HMAC session, getCurrentUser
  data/                   FinanceStore, SeedStore, SupabaseStore, validate, local-json
  supabase/               SSR + browser clients, env guard, proxy session

data/seed.ts              bundled dataset (FCFA)
data/dataset.local.json   form-provided dataset (gitignored, created on save)
supabase/                 migrations + seed SQL (the persistence target)
```

### The engine

`lib/finance/metrics.ts` holds every calculation as a pure function:
`pctChange`, `arrFromMrr`, `netNewMrr`, `grossProfit` → `operatingProfit`
→ `netProfit`, `margin`, `netCashFlow`, `netBurn`, `runwayMonths`,
`budgetVariance`, `requiredMonthlyGrowth`, `linearForecast`,
`weightedPipeline`.

`lib/finance/snapshot.ts#buildSnapshot()` turns a `FinanceDataset` into
the `CommandCenterSnapshot` the dashboard renders — headline figures,
month-over-month deltas, a 3-month linear forecast, goal progress, alert
rules and trend series.

`lib/finance/briefing.ts#buildBriefing()` is a **rule-based** executive
summary that fills the §30 "AI briefing" slot until the AI Intelligence
module replaces it.

---

## Roadmap (V2)

Scenario planning · advanced forecasting · unit economics · banking &
accounting integrations · advanced AI · multi-company · granular
permissions. See master prompt §35.
