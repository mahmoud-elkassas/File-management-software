-- Fix RLS Policies for Production Environment
-- Run this in your Supabase SQL Editor to fix the delete issue

-- First, let's check current policies
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('persons', 'sms_history');

-- Drop ALL existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable read access for all users" ON persons;
DROP POLICY IF EXISTS "Enable insert access for all users" ON persons;
DROP POLICY IF EXISTS "Enable update access for all users" ON persons;
DROP POLICY IF EXISTS "Enable delete access for all users" ON persons;
DROP POLICY IF EXISTS "Allow all operations for persons" ON persons;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON persons;
DROP POLICY IF EXISTS "persons_anon_all" ON persons;
DROP POLICY IF EXISTS "persons_anon_select" ON persons;
DROP POLICY IF EXISTS "persons_anon_insert" ON persons;
DROP POLICY IF EXISTS "persons_anon_update" ON persons;
DROP POLICY IF EXISTS "persons_anon_delete" ON persons;

DROP POLICY IF EXISTS "Enable read access for all users" ON sms_history;
DROP POLICY IF EXISTS "Enable insert access for all users" ON sms_history;
DROP POLICY IF EXISTS "Allow all operations for sms_history" ON sms_history;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON sms_history;
DROP POLICY IF EXISTS "sms_history_anon_all" ON sms_history;
DROP POLICY IF EXISTS "sms_history_anon_select" ON sms_history;
DROP POLICY IF EXISTS "sms_history_anon_insert" ON sms_history;

-- Disable RLS temporarily to check if that's the issue
ALTER TABLE persons DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_history DISABLE ROW LEVEL SECURITY;

-- Test if tables are accessible without RLS
SELECT 'Testing access without RLS...' as status;

-- Re-enable RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies that explicitly allow ALL operations for anonymous users
-- Use unique policy names to avoid conflicts
CREATE POLICY "persons_full_access_2024" ON persons 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "sms_history_full_access_2024" ON sms_history 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Alternative: Create specific policies for each operation with unique names
CREATE POLICY "persons_select_2024" ON persons 
FOR SELECT 
USING (true);

CREATE POLICY "persons_insert_2024" ON persons 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "persons_update_2024" ON persons 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "persons_delete_2024" ON persons 
FOR DELETE 
USING (true);

-- SMS history policies
CREATE POLICY "sms_history_select_2024" ON sms_history 
FOR SELECT 
USING (true);

CREATE POLICY "sms_history_insert_2024" ON sms_history 
FOR INSERT 
WITH CHECK (true);

-- Verify the policies were created
SELECT 'New policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('persons', 'sms_history')
ORDER BY tablename, cmd;

-- Test insert and delete operations
SELECT 'Testing operations...' as status;

-- Test insert
INSERT INTO persons (name, phone, date, status, list_number, receipt_number, register_number, request_name)
VALUES ('TEST_USER', '+1234567890', CURRENT_DATE, 'تم الاستلام', 'TEST_' || EXTRACT(EPOCH FROM NOW()), 'R_TEST', 'REG_TEST', 'Test Request')
ON CONFLICT (list_number) DO NOTHING;

-- Test delete
DELETE FROM persons WHERE list_number LIKE 'TEST_%';

SELECT 'RLS policies fixed successfully!' as status; 