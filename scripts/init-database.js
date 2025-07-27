import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL and Anon Key are required');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Initializing Supabase database...');
  
  try {
    // Create persons table
    console.log('📋 Creating persons table...');
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
      console.log('⚠️  Could not create persons table via RPC, trying direct approach...');
      // Try to access the table to see if it exists
      const { error: checkError } = await supabase
        .from('persons')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('does not exist')) {
        console.error('❌ Persons table does not exist and cannot be created via RPC');
        console.log('💡 Please create the table manually in the Supabase dashboard');
      } else {
        console.log('✅ Persons table exists or was created successfully');
      }
    } else {
      console.log('✅ Persons table created successfully');
    }

    // Create sms_history table
    console.log('📋 Creating sms_history table...');
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
      console.log('⚠️  Could not create sms_history table via RPC, trying direct approach...');
      // Try to access the table to see if it exists
      const { error: checkError } = await supabase
        .from('sms_history')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('does not exist')) {
        console.error('❌ SMS history table does not exist and cannot be created via RPC');
        console.log('💡 Please create the table manually in the Supabase dashboard');
      } else {
        console.log('✅ SMS history table exists or was created successfully');
      }
    } else {
      console.log('✅ SMS history table created successfully');
    }

    console.log('\n🎉 Database initialization completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Authentication → Policies');
    console.log('4. Enable RLS policies for both tables');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.log('\n💡 Manual setup required:');
    console.log('Please create the tables manually in your Supabase dashboard using the SQL commands from SUPABASE_SETUP.md');
  }
}

createTables(); 