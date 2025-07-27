import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({
        success: false,
        error: 'Supabase URL and Anon Key are required'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create persons table
    const { error: personsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (personsError) {
      console.error('Error creating persons table:', personsError);
      // Try alternative approach using direct SQL
      const { error: directPersonsError } = await supabase
        .from('persons')
        .select('id')
        .limit(1);
      
      if (directPersonsError && directPersonsError.message.includes('does not exist')) {
        console.error('Persons table does not exist and cannot be created via RPC');
      }
    }

    // Create sms_history table
    const { error: smsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sms_history (
          id BIGSERIAL PRIMARY KEY,
          to_number VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          delivery_status VARCHAR(50) NOT NULL,
          error TEXT,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (smsError) {
      console.error('Error creating sms_history table:', smsError);
      // Try alternative approach using direct SQL
      const { error: directSmsError } = await supabase
        .from('sms_history')
        .select('id')
        .limit(1);
      
      if (directSmsError && directSmsError.message.includes('does not exist')) {
        console.error('SMS history table does not exist and cannot be created via RPC');
      }
    }

    res.json({ 
      success: true, 
      message: 'Supabase database initialization attempted. Please create tables manually in Supabase dashboard if they do not exist.',
      tables: ['persons', 'sms_history'],
      note: 'If tables do not exist, please create them manually in the Supabase dashboard using the SQL provided in SUPABASE_SETUP.md'
    });
  } catch (error) {
    console.error('Error initializing Supabase database:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack,
      note: 'Please create the database tables manually in the Supabase dashboard'
    });
  }
} 