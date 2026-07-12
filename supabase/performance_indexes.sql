-- PERFORMANCE OPTIMIZATION: INDEXES
-- Target: Improve P95 latency for core domains (Obras, CRM)

-- 1. Obras Domain
CREATE INDEX IF NOT EXISTS idx_obras_empresa_active
ON public.obras (empresa_id, deleted_at, created_at DESC);

-- 2. CRM Deals
CREATE INDEX IF NOT EXISTS idx_crm_deals_empresa_updated
ON public.crm_deals (empresa_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_deals_workspace
ON public.crm_deals (empresa_id, workspace_id, updated_at DESC);

-- 3. CRM Activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal
ON public.crm_activities (empresa_id, deal_id, created_at DESC);

-- 4. CRM Leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_empresa_updated
ON public.crm_leads (empresa_id, updated_at DESC);

-- 5. CRM Companies & Contacts (Search optimization)
CREATE INDEX IF NOT EXISTS idx_crm_companies_empresa_nome
ON public.crm_companies (empresa_id, nome);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_empresa_email
ON public.crm_contacts (empresa_id, email);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_empresa_nome
ON public.crm_contacts (empresa_id, nome);
