-- Step 1: Drop all policies that reference user_id on each table
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('transactions','credit_cards','assets','liabilities','financial_goals','subscriptions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Step 2: Disable RLS on all tables
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop FK constraints
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN ('transactions','credit_cards','assets','liabilities','financial_goals','subscriptions')
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- Step 4: Change user_id to text
ALTER TABLE transactions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE credit_cards ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE assets ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE liabilities ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE financial_goals ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE subscriptions ALTER COLUMN user_id TYPE text USING user_id::text;
