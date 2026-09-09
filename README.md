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
| **Chiffre d'affaires** — by month / client / service / **catalogue offer** / country / type | ✅ (`/revenue`) |
| **RIXZA catalogue (Pricing Engine V2)** — ~55 offres avec prix FCFA; sélecteur qui pré-remplit les montants; règles de marge RIXZA (plancher 50 %, cœur 55-65 %) dans le Health Score et les alertes | ✅ (`lib/finance/catalogue.ts`) |
| **Factures** — invoice + payment CRUD, AR metrics, auto-overdue | ✅ (`/invoices`) |
| **Clients** — portfolio table + per-client financial profile | ✅ (`/clients`, `/clients/[id]`) |
| **Dépenses** — expense + recurring-cost CRUD, per-category breakdown | ✅ (`/expenses`) |
| **Compte de résultat** — full monthly P&L | ✅ (`/pnl`) |
| **Données** — company, subscriptions, one-off revenue, budget, goals | ✅ (`/data`) |
| Accounts with roles (owner / admin / viewer), edit gated to OWNER·ADMIN·FINANCE, server-enforced (403) | ✅ (`lib/auth`) |
| Signed-cookie login with no backend, sign-out, global "+" quick-add | ✅ |
| Blank slate — no fictitious data; every screen prompts for real input | ✅ |
| Data persistence: Supabase JSONB row (prod / Vercel) or local JSON file (dev) | ✅ (`lib/data`) |
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
cp .env.example .env.local   # then fill it in (accounts, secret)
npm run dev
```

Open <http://localhost:3000>. You land on `/login`.

**Default accounts (no `APP_AUTH_USERS` set), password `rixza`:**

| Compte | Rôle | Peut saisir les données |
| --- | --- | --- |
| `owner@rixza.local` | OWNER | oui |
| `admin@rixza.local` | ADMIN | oui |
| `viewer@rixza.local` | VIEWER | non (lecture seule) |

Override with `APP_AUTH_USERS="email:pass:ROLE,…"` (or single-user
`APP_AUTH_EMAIL`/`APP_AUTH_PASSWORD`/`APP_AUTH_ROLE`). Always set
`APP_SESSION_SECRET` outside local dev.

After signing in you land on `/command-center`. **It starts empty** — no
fictitious data. An OWNER/ADMIN/FINANCE user enters RIXZA's real records
(clients, subscriptions, invoices, payments, expenses, budget, goals) on
the dedicated screens; the dashboard fills in immediately and can be
updated anytime.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

---

## Data & auth

**Auth** — always a local signed session cookie (`HMAC-SHA256`, Web
Crypto). `proxy.ts` gates every request: no cookie → pages redirect to
`/login`, `/api/*` gets `401`. Accounts come from `APP_AUTH_USERS`.
`getCurrentUser()` (`lib/auth/current-user.ts`) reads the user in Server
Components; sign-out is `POST /api/auth/logout`.

**Data** — the whole app is one `RixzaData` document behind the
`FinanceStore` interface (`lib/data/store.ts`):

| Condition | Store |
| --- | --- |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set | `SupabaseStore` — one JSONB row in `app_data`. **Required on Vercel** (read-only filesystem). |
| otherwise | `SeedStore` — `data/dataset.local.json` (gitignored), else the empty `data/seed.ts`. Dev only. |

CRUD screens send the full `RixzaData` to `PUT /api/dataset` →
`parseRixzaData` validates → `store.setData()` → `revalidatePath`. Writes
are restricted to OWNER / ADMIN / FINANCE (403 otherwise).

---

## Deploy to Vercel

1. **Supabase** — create a project, run `supabase/migrations/0001_init.sql`
   in the SQL editor. Copy from *Project Settings → API*: the project URL
   and the **`service_role`** key (secret).
2. **Import** the repo at <https://vercel.com/new> (framework auto-detected).
3. **Environment Variables** (Project Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `APP_SESSION_SECRET` | a random string — `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
   | `APP_AUTH_USERS` | `ryan@rixza.local:ryan:OWNER,grace@rixza.local:grace:ADMIN,viewer@rixza.local:rixza:VIEWER` |
   | `SUPABASE_URL` | your project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key |

4. **Deploy.** Every push to `main` redeploys.

CLI alternative: `npx vercel` then `npx vercel --prod` (after `vercel login`).

---

## Architecture

```
app/
  (app)/                 authenticated shell (sidebar + topbar)
    command-center/       the executive dashboard
    data/                 the "Données" input form (OWNER/ADMIN/FINANCE)
    settings/             session, workspace, accounts & roles
  api/
    auth/login·logout/    local credential auth (signed cookie)
    dataset/              GET (all) · PUT/DELETE (editors only, 403 otherwise)
  login/                  sign-in
  page.tsx                → redirect to /command-center
proxy.ts                  auth gate on every request

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
