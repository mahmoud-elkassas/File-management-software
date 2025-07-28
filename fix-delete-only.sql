-- Simple fix for delete operation in production
-- Run this in your Supabase SQL Editor

-- Check current policies first
SELECT 'Current policies for persons table:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'persons';

-- Drop only the problematic policies (if they exist)
DROP POLICY IF EXISTS "Enable delete access for all users" ON persons;
DROP POLICY IF EXISTS "persons_anon_delete" ON persons;
DROP POLICY IF EXISTS "persons_delete_2024" ON persons;

-- Create a simple delete policy
CREATE POLICY "enable_delete_for_all" ON persons 
FOR DELETE 
USING (true);

-- Test the delete operation
SELECT 'Testing delete operation...' as status;

-- Insert a test record
INSERT INTO persons (name, phone, date, status, list_number, receipt_number, register_number, request_name)
VALUES ('DELETE_TEST', '+1234567890', CURRENT_DATE, 'تم الاستلام', 'DELETE_TEST_' || EXTRACT(EPOCH FROM NOW()), 'R_TEST', 'REG_TEST', 'Test Request')
ON CONFLICT (list_number) DO NOTHING;

-- Try to delete it
DELETE FROM persons WHERE list_number LIKE 'DELETE_TEST_%';

SELECT 'Delete policy created successfully!' as status; 