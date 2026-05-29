-- CRM Custom Tabs: Allow clients to create custom views/tabs to organize cards

CREATE TABLE IF NOT EXISTS crm_custom_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES crm_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  filter_etapa TEXT[],
  filter_prioridade TEXT[],
  filter_origem TEXT[],
  filter_owner_id UUID[],
  filter_search TEXT,
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, workspace_id, name)
);

-- RLS para custom tabs
ALTER TABLE crm_custom_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company custom tabs"
  ON crm_custom_tabs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create custom tabs in their company"
  ON crm_custom_tabs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company custom tabs"
  ON crm_custom_tabs FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company custom tabs"
  ON crm_custom_tabs FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_crm_custom_tabs_company_id ON crm_custom_tabs(company_id);
CREATE INDEX idx_crm_custom_tabs_workspace_id ON crm_custom_tabs(workspace_id);
