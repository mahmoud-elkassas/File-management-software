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
    const { error: personsError } = await supabase.rpc('create_persons_table', {});
    if (personsError && !personsError.message.includes('already exists')) {
      console.error('Error creating persons table:', personsError);
    }

    // Create sms_history table
    const { error: smsError } = await supabase.rpc('create_sms_history_table', {});
    if (smsError && !smsError.message.includes('already exists')) {
      console.error('Error creating sms_history table:', smsError);
    }

    res.json({ 
      success: true, 
      message: 'Supabase database initialized successfully',
      tables: ['persons', 'sms_history']
    });
  } catch (error) {
    console.error('Error initializing Supabase database:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack
    });
  }
} 