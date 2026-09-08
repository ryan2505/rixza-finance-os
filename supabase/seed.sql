-- =====================================================================
-- RIXZA Finance OS — amorçage Supabase (données réelles uniquement)
--
-- Ce fichier ne contient AUCUNE donnée fictive : seulement la société et
-- un exemple de rattachement d'un utilisateur. Toutes les données
-- financières sont saisies par la direction via l'écran « Données » de
-- l'application (ou insérées ici si vous migrez un existant).
-- À exécuter avec le rôle service (contourne la RLS).
-- =====================================================================

insert into companies (id, name, base_currency)
values ('11111111-1111-1111-1111-111111111111', 'RIXZA', 'XAF')
on conflict (id) do nothing;

-- Rattachez votre utilisateur d'authentification à la société avec un rôle :
--   OWNER   : accès complet
--   ADMIN   : saisie + gestion financière
--   FINANCE : saisie financière
--   MANAGER : tableaux de bord en lecture
--   VIEWER  : lecture seule
--
-- insert into memberships (company_id, user_id, role)
-- values ('11111111-1111-1111-1111-111111111111', '<votre-auth-uid>', 'owner');

-- Aucune ligne financials/clients/invoices/budget/goals : la base démarre
-- vide, comme l'application en mode local.
