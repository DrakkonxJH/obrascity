-- CRM Workspaces: Separar CRM por contextos (Vendas, Operacional, Engenharia, etc.)

CREATE TABLE IF NOT EXISTS crm_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Associar deals ao workspace (null = workspace padrão)
ALTER TABLE crm_deals ADD COLUMN workspace_id UUID REFERENCES crm_workspaces(id) ON DELETE SET NULL;

-- RLS para workspaces
ALTER TABLE crm_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces of their company"
  ON crm_workspaces FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage workspaces"
  ON crm_workspaces FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_crm_workspaces_company_id ON crm_workspaces(company_id);
CREATE INDEX idx_crm_deals_workspace_id ON crm_deals(workspace_id);
