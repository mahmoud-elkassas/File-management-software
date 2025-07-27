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

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...');
  
  try {
    // Step 1: Create persons table if it doesn't exist
    console.log('📋 Step 1: Creating persons table...');
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
      console.log('⚠️  Could not create persons table via RPC, checking if it exists...');
      const { error: checkError } = await supabase
        .from('persons')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('does not exist')) {
        console.error('❌ Persons table does not exist and cannot be created via RPC');
        console.log('💡 Please create the table manually in the Supabase dashboard');
        return;
      } else {
        console.log('✅ Persons table exists');
      }
    } else {
      console.log('✅ Persons table created successfully');
    }

    // Step 2: Create sms_history table if it doesn't exist
    console.log('📋 Step 2: Creating sms_history table...');
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
      console.log('⚠️  Could not create sms_history table via RPC, checking if it exists...');
      const { error: checkError } = await supabase
        .from('sms_history')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('does not exist')) {
        console.error('❌ SMS history table does not exist and cannot be created via RPC');
        console.log('💡 Please create the table manually in the Supabase dashboard');
        return;
      } else {
        console.log('✅ SMS history table exists');
      }
    } else {
      console.log('✅ SMS history table created successfully');
    }

    // Step 3: Enable RLS on both tables
    console.log('🔒 Step 3: Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.log('⚠️  Could not enable RLS via RPC, but tables might already have RLS enabled');
    } else {
      console.log('✅ Row Level Security enabled');
    }

    // Step 4: Create RLS policies
    console.log('🔧 Step 4: Creating RLS policies...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable read access for all users" ON persons;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON persons;
        DROP POLICY IF EXISTS "Enable update access for all users" ON persons;
        DROP POLICY IF EXISTS "Enable delete access for all users" ON persons;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON sms_history;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON sms_history;
        
        DROP POLICY IF EXISTS "Allow all operations for persons" ON persons;
        DROP POLICY IF EXISTS "Allow all operations for sms_history" ON sms_history;
        
        -- Create comprehensive policies for persons table
        CREATE POLICY "Allow all operations for persons" ON persons FOR ALL USING (true) WITH CHECK (true);
        
        -- Create comprehensive policies for sms_history table
        CREATE POLICY "Allow all operations for sms_history" ON sms_history FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (policyError) {
      console.error('❌ Could not create RLS policies via RPC:', policyError.message);
      console.log('💡 Please create policies manually in the Supabase dashboard');
    } else {
      console.log('✅ RLS policies created successfully');
    }

    // Step 5: Test the setup
    console.log('🧪 Step 5: Testing database setup...');
    
    // Test persons table
    const { data: personsTest, error: personsTestError } = await supabase
      .from('persons')
      .select('id')
      .limit(1);
    
    if (personsTestError) {
      console.error('❌ Error testing persons table:', personsTestError.message);
    } else {
      console.log('✅ Persons table is accessible');
    }
    
    // Test sms_history table
    const { data: smsTest, error: smsTestError } = await supabase
      .from('sms_history')
      .select('id')
      .limit(1);
    
    if (smsTestError) {
      console.error('❌ Error testing sms_history table:', smsTestError.message);
    } else {
      console.log('✅ SMS history table is accessible');
    }
    
    // Test insert operation
    console.log('📝 Testing insert operation...');
    const testPerson = {
      name: 'Test User',
      phone: '+970599999999',
      date: new Date().toISOString().split('T')[0],
      status: 'تم الاستلام',
      list_number: 'TEST' + Date.now(),
      receipt_number: 'R' + Date.now(),
      register_number: 'REG' + Date.now(),
      request_name: 'Test Request'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('persons')
      .insert([testPerson])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      console.log('\n🔧 RLS policies need to be fixed manually');
      console.log('Please run the fix-rls-policies.sql file in your Supabase SQL Editor');
    } else {
      console.log('✅ Insert test successful');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('persons')
        .delete()
        .eq('list_number', testPerson.list_number);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('\n📝 If any steps failed, please run the SQL commands manually in your Supabase dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Run the database-setup.sql file');
    
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    console.log('\n💡 Manual setup required:');
    console.log('Please run the database-setup.sql file in your Supabase SQL Editor');
  }
}

setupDatabase(); 