-- Add master account identification
ALTER TABLE companies ADD COLUMN is_master BOOLEAN DEFAULT FALSE;

-- Create index for fast filtering
CREATE INDEX idx_companies_is_master ON companies(is_master);

-- RLS Policy: Ensure master account data is never visible to non-master users
CREATE POLICY "Never expose master account to clients"
  ON crm_workspaces FOR SELECT
  USING (
    -- Users can only see workspaces from their own company
    -- AND that company must not be the master account
    -- OR they must be from the master account themselves
    company_id IN (
      SELECT c.id FROM companies c
      JOIN user_company_rel ucr ON c.id = ucr.company_id
      WHERE ucr.user_id = auth.uid()
      AND (c.is_master = FALSE OR c.id = (
        SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
      ))
    )
  );

-- Drop old policies on crm_workspaces if they exist
DROP POLICY IF EXISTS "Users can view workspaces of their company" ON crm_workspaces;
DROP POLICY IF EXISTS "Admin can manage workspaces" ON crm_workspaces;

-- New comprehensive RLS policies
ALTER TABLE crm_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their company workspaces"
  ON crm_workspaces FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Block access to master company workspaces for non-master users"
  ON crm_workspaces FOR SELECT
  USING (
    -- Allow only if company is not master, OR if user's company IS the master
    NOT EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_workspaces.company_id
      AND companies.is_master = TRUE
      AND companies.id != (
        SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
      )
    )
  );

CREATE POLICY "Users can create workspaces in their company only"
  ON crm_workspaces FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update their company workspaces"
  ON crm_workspaces FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only delete their company workspaces"
  ON crm_workspaces FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
  );
