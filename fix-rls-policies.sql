-- Fix RLS Policies for File Management Software
-- Run this in your Supabase SQL Editor to fix the insert error

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable read access for all users" ON persons;
DROP POLICY IF EXISTS "Enable insert access for all users" ON persons;
DROP POLICY IF EXISTS "Enable update access for all users" ON persons;
DROP POLICY IF EXISTS "Enable delete access for all users" ON persons;

DROP POLICY IF EXISTS "Enable read access for all users" ON sms_history;
DROP POLICY IF EXISTS "Enable insert access for all users" ON sms_history;

-- Create comprehensive policies that allow all operations for anonymous users
CREATE POLICY "Allow all operations for persons" ON persons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for sms_history" ON sms_history FOR ALL USING (true) WITH CHECK (true);

-- Verify the policies were created
SELECT 'RLS policies fixed successfully!' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('persons', 'sms_history'); 