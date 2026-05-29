-- Identify and mark the master company account
-- The master company is typically the first or oldest company, or one with specific naming

-- First, let's mark the company by looking for specific patterns:
-- 1. Companies with "Master" in the name
-- 2. Or the oldest/first company created
-- 3. Or companies owned by the system

-- Update master flag for companies with "Master" in the name (case-insensitive)
UPDATE companies 
SET is_master = TRUE 
WHERE LOWER(nome) LIKE '%master%' 
AND is_master = FALSE;

-- If no master was found by name, mark the oldest company as master
-- (this assumes the first company created is the master account)
UPDATE companies 
SET is_master = TRUE 
WHERE id = (
  SELECT id FROM companies 
  WHERE is_master = FALSE 
  ORDER BY created_at ASC NULLS LAST 
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM companies WHERE is_master = TRUE
);

-- Ensure all other companies are NOT marked as master
-- (safety: prevent multiple masters)
UPDATE companies 
SET is_master = FALSE 
WHERE is_master = TRUE 
AND id != (
  SELECT id FROM companies 
  WHERE is_master = TRUE 
  ORDER BY created_at ASC NULLS LAST 
  LIMIT 1
);

-- Log the result: show which company is marked as master
-- This helps verify the operation worked correctly
-- SELECT id, nome, is_master, created_at FROM companies ORDER BY is_master DESC, created_at ASC;
