-- Add RLS policy to prevent master profiles from being selectable in dropdowns
-- This is the ultimate safeguard: profiles from master companies should NEVER be visible to clients

-- First, ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old profile policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view profiles from their company" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- New policy: Users can only see profiles from their company, NEVER from master
CREATE POLICY "Users can only view non-master company profiles"
  ON profiles FOR SELECT
  USING (
    -- User's company must match, AND
    empresa_id IN (
      SELECT company_id FROM user_company_rel
      WHERE user_id = auth.uid()
    )
    -- AND the profile's company must NOT be marked as master
    AND NOT EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = profiles.empresa_id
      AND companies.is_master = TRUE
    )
  );

-- Policy: Users can update their own profile (but still must not be master)
CREATE POLICY "Users can update their own profile if not master"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = profiles.empresa_id
      AND companies.is_master = TRUE
    )
  )
  WITH CHECK (
    id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = profiles.empresa_id
      AND companies.is_master = TRUE
    )
  );

-- Policy: Allow master users to see all profiles (admins need access)
CREATE POLICY "Master admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    -- Current user's company is master, OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = (
        SELECT empresa_id FROM profiles WHERE id = auth.uid()
      )
      AND companies.is_master = TRUE
    )
  );
