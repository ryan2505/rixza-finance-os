-- =====================================================================
-- RIXZA Finance OS — schéma Supabase
--
-- L'application est mono-tenant (RIXZA) et opère sur un seul document
-- `RixzaData`. Il est stocké ici en une ligne JSONB. Toute la validation
-- se fait dans l'app (lib/data/validate.ts) ; les chiffres mensuels sont
-- dérivés à la volée (lib/finance/derive.ts).
--
-- L'authentification NE passe PAS par Supabase Auth : elle utilise un
-- cookie signé local (voir lib/auth). Le serveur accède à cette table
-- avec la clé service_role, donc la RLS bloque tout le reste.
-- =====================================================================

create table if not exists app_data (
  id text primary key default 'rixza',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;
-- Aucune policy pour anon / authenticated : seul service_role (qui
-- contourne la RLS) peut lire et écrire.

comment on table app_data is
  'Document RixzaData unique de RIXZA Finance OS (clients, abonnements, factures, paiements, dépenses, budget, objectifs).';
