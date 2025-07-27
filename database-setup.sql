-- Database Setup for File Management Software
-- Run this in your Supabase SQL Editor

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(100) NOT NULL,
  list_number VARCHAR(100) NOT NULL UNIQUE,
  receipt_number VARCHAR(100) NOT NULL,
  register_number VARCHAR(100) NOT NULL,
  request_name VARCHAR(255) NOT NULL,
  files TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_history table
CREATE TABLE IF NOT EXISTS sms_history (
  id BIGSERIAL PRIMARY KEY,
  to_number VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  delivery_status VARCHAR(50) NOT NULL,
  error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON persons;
DROP POLICY IF EXISTS "Enable insert access for all users" ON persons;
DROP POLICY IF EXISTS "Enable update access for all users" ON persons;
DROP POLICY IF EXISTS "Enable delete access for all users" ON persons;

DROP POLICY IF EXISTS "Enable read access for all users" ON sms_history;
DROP POLICY IF EXISTS "Enable insert access for all users" ON sms_history;

-- Create new policies for persons table (allow all operations for anonymous users)
CREATE POLICY "Allow all operations for persons" ON persons FOR ALL USING (true) WITH CHECK (true);

-- Create new policies for sms_history table (allow all operations for anonymous users)
CREATE POLICY "Allow all operations for sms_history" ON sms_history FOR ALL USING (true) WITH CHECK (true);

-- Alternative: Create specific policies if the above doesn't work
-- CREATE POLICY "Enable read access for all users" ON persons FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON persons FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON persons FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON persons FOR DELETE USING (true);

-- CREATE POLICY "Enable read access for all users" ON sms_history FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON sms_history FOR INSERT WITH CHECK (true);

-- Insert sample data (optional)
INSERT INTO persons (name, phone, date, status, list_number, receipt_number, register_number, request_name) 
VALUES 
  ('أحمد محمد', '+970599123456', '2025-01-27', 'تم الاستلام', 'L001', 'R001', 'REG001', 'طلب جواز سفر'),
  ('فاطمة علي', '+970599789012', '2025-01-27', 'قيد المعالجة', 'L002', 'R002', 'REG002', 'طلب هوية'),
  ('محمد أحمد', '+970599345678', '2025-01-27', 'جاهز', 'L003', 'R003', 'REG003', 'طلب شهادة ميلاد')
ON CONFLICT (list_number) DO NOTHING;

-- Show tables and policies
SELECT 'Tables and policies created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('persons', 'sms_history');
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('persons', 'sms_history'); 