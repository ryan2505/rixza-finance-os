-- =====================================================================
-- RIXZA Finance OS — initial schema
-- Master prompt §33 (data architecture) and §34 (permissions / RBAC).
--
-- Principles:
--   * Multi-tenant by `company_id`; every row is reachable only through a
--     membership.
--   * Financial history is append-friendly: `financial_snapshots` are never
--     overwritten in place (one row per company per month).
--   * Source transactions keep their original currency + rate; consolidated
--     reporting uses `base_amount` in the company's base currency.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type role as enum ('owner', 'admin', 'finance', 'manager', 'viewer');
create type currency_code as enum ('EUR', 'XAF', 'USD', 'CAD', 'GBP');
create type revenue_type as enum ('one_time', 'recurring', 'subscription', 'retainer');
create type sales_channel as enum ('outbound', 'inbound', 'referral', 'partnership', 'organic', 'paid');
create type service_line as enum ('website', 'seo', 'aeo', 'geo', 'automation', 'ai', 'consulting', 'maintenance');
create type invoice_status as enum ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled');
create type expense_group as enum ('operations', 'marketing', 'human_resources', 'sales', 'administration');
create type recurrence as enum ('one_time', 'monthly', 'quarterly', 'yearly');
create type goal_metric as enum ('revenue', 'mrr', 'arr', 'profit', 'cash', 'clients');
create type opportunity_stage as enum ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
create type txn_direction as enum ('in', 'out');

-- ---------------------------------------------------------------------
-- Identity & tenancy
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency currency_code not null default 'EUR',
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index on memberships (user_id);
create index on memberships (company_id);

-- ---------------------------------------------------------------------
-- RBAC helpers (§34)
-- ---------------------------------------------------------------------

-- Companies the current user can see at all.
create or replace function app_company_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select company_id from memberships where user_id = auth.uid();
$$;

-- Numeric rank so policies can express "at least finance".
create or replace function app_role_rank(r role)
returns int language sql immutable as $$
  select case r
    when 'owner' then 5
    when 'admin' then 4
    when 'finance' then 3
    when 'manager' then 2
    when 'viewer' then 1
  end;
$$;

create or replace function app_has_min_role(target_company uuid, min_role role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid()
      and m.company_id = target_company
      and app_role_rank(m.role) >= app_role_rank(min_role)
  );
$$;

-- ---------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------
create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  from_currency currency_code not null,
  to_currency currency_code not null,
  rate numeric(18, 8) not null check (rate > 0),
  as_of date not null,
  unique (company_id, from_currency, to_currency, as_of)
);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  country text,
  channel sales_channel,
  services service_line[] not null default '{}',
  start_date date,
  renewal_date date,
  contract_value numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index on clients (company_id);

-- ---------------------------------------------------------------------
-- Transactions & derived revenue / expense rows
-- ---------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  direction txn_direction not null,
  occurred_on date not null,
  description text,
  -- multi-currency (§20)
  original_currency currency_code not null,
  original_amount numeric(14, 2) not null,
  exchange_rate numeric(18, 8) not null default 1,
  base_currency currency_code not null,
  base_amount numeric(14, 2) not null,
  created_at timestamptz not null default now()
);
create index on transactions (company_id, occurred_on);

create table revenues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  transaction_id uuid references transactions (id) on delete set null,
  service service_line,
  type revenue_type not null default 'one_time',
  booked_on date not null,
  base_amount numeric(14, 2) not null,
  created_at timestamptz not null default now()
);
create index on revenues (company_id, booked_on);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  transaction_id uuid references transactions (id) on delete set null,
  expense_group expense_group not null,
  subcategory text,
  vendor text,
  payment_method text,
  is_cogs boolean not null default false,
  spent_on date not null,
  base_amount numeric(14, 2) not null,
  responsible uuid references profiles (id) on delete set null,
  attachment_url text,
  created_at timestamptz not null default now()
);
create index on expenses (company_id, spent_on);

create table recurring_revenues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  client_id uuid references clients (id) on delete cascade,
  label text,
  amount numeric(14, 2) not null,
  frequency recurrence not null default 'monthly',
  active boolean not null default true,
  started_on date not null,
  ended_on date,
  created_at timestamptz not null default now()
);
create index on recurring_revenues (company_id, active);

create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  label text not null,
  vendor text,
  expense_group expense_group not null default 'operations',
  amount numeric(14, 2) not null,
  frequency recurrence not null default 'monthly',
  active boolean not null default true,
  next_due date,
  created_at timestamptz not null default now()
);
create index on recurring_expenses (company_id, active);

-- ---------------------------------------------------------------------
-- Invoices & payments (§18, §19)
-- ---------------------------------------------------------------------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  client_id uuid not null references clients (id) on delete restrict,
  number text not null,
  currency currency_code not null,
  amount numeric(14, 2) not null,
  base_amount numeric(14, 2) not null,
  issue_date date not null,
  due_date date not null,
  status invoice_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (company_id, number)
);
create index on invoices (company_id, status);

create table payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  invoice_id uuid references invoices (id) on delete set null,
  transaction_id uuid references transactions (id) on delete set null,
  paid_on date not null,
  base_amount numeric(14, 2) not null,
  created_at timestamptz not null default now()
);
create index on payments (company_id, paid_on);

-- ---------------------------------------------------------------------
-- Budget (§11, §12)
-- ---------------------------------------------------------------------
create table budgets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  fiscal_year int not null,
  revenue_target numeric(14, 2) not null default 0,
  expense_budget numeric(14, 2) not null default 0,
  profit_target numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, fiscal_year)
);

create table budget_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  budget_id uuid references budgets (id) on delete cascade,
  month text not null,                 -- 'YYYY-MM'
  expense_group expense_group not null,
  label text not null,
  budget numeric(14, 2) not null default 0,
  actual numeric(14, 2) not null default 0,
  unique (company_id, month, expense_group, label)
);
create index on budget_lines (company_id, month);

-- ---------------------------------------------------------------------
-- Goals, opportunities, forecasts (§21, §22, §25)
-- ---------------------------------------------------------------------
create table financial_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  label text not null,
  metric goal_metric not null,
  target numeric(16, 2) not null,
  target_date date not null,
  current_value numeric(16, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index on financial_goals (company_id);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  name text not null,
  stage opportunity_stage not null default 'lead',
  amount numeric(14, 2) not null default 0,
  probability numeric(4, 3) not null default 0 check (probability between 0 and 1),
  expected_close date,
  created_at timestamptz not null default now()
);
create index on opportunities (company_id, stage);

create table forecasts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  scenario text not null default 'base',      -- conservative | base | optimistic
  month text not null,                        -- 'YYYY-MM'
  revenue numeric(14, 2),
  mrr numeric(14, 2),
  expenses numeric(14, 2),
  profit numeric(14, 2),
  cash numeric(14, 2),
  created_at timestamptz not null default now(),
  unique (company_id, scenario, month)
);

-- ---------------------------------------------------------------------
-- Monthly snapshots — historised, never overwritten in place (§33)
-- ---------------------------------------------------------------------
create table financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  month text not null,                        -- 'YYYY-MM'
  recurring_revenue numeric(14, 2) not null default 0,
  one_time_revenue numeric(14, 2) not null default 0,
  cogs numeric(14, 2) not null default 0,
  operating_expenses numeric(14, 2) not null default 0,
  taxes_and_other numeric(14, 2) not null default 0,
  cash_in numeric(14, 2) not null default 0,
  cash_out numeric(14, 2) not null default 0,
  cash_balance numeric(14, 2) not null default 0,
  mrr_new numeric(14, 2) not null default 0,
  mrr_expansion numeric(14, 2) not null default 0,
  mrr_contraction numeric(14, 2) not null default 0,
  mrr_churned numeric(14, 2) not null default 0,
  captured_at timestamptz not null default now(),
  unique (company_id, month)
);
create index on financial_snapshots (company_id, month);

-- ---------------------------------------------------------------------
-- Client financial profile (§8) — derived view
-- ---------------------------------------------------------------------
create view client_financials as
select
  c.id,
  c.company_id,
  c.name,
  c.country,
  c.channel,
  c.services,
  c.start_date,
  c.renewal_date,
  c.contract_value,
  coalesce(rev.total_revenue, 0) as total_revenue,
  coalesce(rr.mrr, 0) as mrr,
  coalesce(rr.mrr, 0) * 12 as arr,
  coalesce(out.outstanding, 0) as outstanding,
  coalesce(rev.revenue_by_month, '{}'::jsonb) as revenue_by_month
from clients c
left join lateral (
  select
    sum(r.base_amount) as total_revenue,
    jsonb_object_agg(to_char(r.booked_on, 'YYYY-MM'), r.month_total) as revenue_by_month
  from (
    select booked_on, base_amount,
           sum(base_amount) over (partition by to_char(booked_on, 'YYYY-MM')) as month_total
    from revenues where client_id = c.id
  ) r
) rev on true
left join lateral (
  select sum(amount) as mrr
  from recurring_revenues
  where client_id = c.id and active and frequency = 'monthly'
) rr on true
left join lateral (
  select sum(base_amount) as outstanding
  from invoices
  where client_id = c.id and status in ('sent', 'pending', 'overdue')
) out on true;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles              enable row level security;
alter table companies             enable row level security;
alter table memberships           enable row level security;
alter table exchange_rates        enable row level security;
alter table clients               enable row level security;
alter table transactions          enable row level security;
alter table revenues              enable row level security;
alter table expenses              enable row level security;
alter table recurring_revenues    enable row level security;
alter table recurring_expenses    enable row level security;
alter table invoices              enable row level security;
alter table payments              enable row level security;
alter table budgets               enable row level security;
alter table budget_lines          enable row level security;
alter table financial_goals       enable row level security;
alter table opportunities         enable row level security;
alter table forecasts             enable row level security;
alter table financial_snapshots   enable row level security;

-- Own profile.
create policy "own profile" on profiles
  for select using (id = auth.uid());
create policy "update own profile" on profiles
  for update using (id = auth.uid());

-- Companies: visible to members; only owners may update.
create policy "member reads company" on companies
  for select using (id in (select app_company_ids()));
create policy "owner updates company" on companies
  for update using (app_has_min_role(id, 'owner'));

-- Memberships: a user sees rows for companies they belong to; admins+ manage.
create policy "reads memberships" on memberships
  for select using (company_id in (select app_company_ids()));
create policy "admin manages memberships" on memberships
  for all using (app_has_min_role(company_id, 'admin'))
  with check (app_has_min_role(company_id, 'admin'));

-- Generic pattern for every company-scoped financial table:
--   read  -> any member (viewer+)
--   write -> finance+ (finance, admin, owner)
do $$
declare t text;
begin
  foreach t in array array[
    'exchange_rates','clients','transactions','revenues','expenses',
    'recurring_revenues','recurring_expenses','invoices','payments',
    'budgets','budget_lines','financial_goals','opportunities',
    'forecasts','financial_snapshots'
  ]
  loop
    execute format(
      'create policy %I on %I for select using (company_id in (select app_company_ids()));',
      t || '_read', t
    );
    execute format(
      'create policy %I on %I for insert with check (app_has_min_role(company_id, ''finance''));',
      t || '_insert', t
    );
    execute format(
      'create policy %I on %I for update using (app_has_min_role(company_id, ''finance'')) with check (app_has_min_role(company_id, ''finance''));',
      t || '_update', t
    );
    execute format(
      'create policy %I on %I for delete using (app_has_min_role(company_id, ''admin''));',
      t || '_delete', t
    );
  end loop;
end $$;

-- =====================================================================
-- New-user bootstrap: mirror auth.users into profiles.
-- =====================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
