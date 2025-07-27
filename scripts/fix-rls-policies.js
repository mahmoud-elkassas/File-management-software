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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies...');
  
  try {
    // Test if we can access the persons table
    console.log('📋 Testing persons table access...');
    const { data: personsTest, error: personsError } = await supabase
      .from('persons')
      .select('id')
      .limit(1);
    
    if (personsError) {
      console.error('❌ Error accessing persons table:', personsError.message);
      
      if (personsError.message.includes('row-level security policy')) {
        console.log('🔧 RLS policy issue detected. Attempting to fix...');
        
        // Try to create the missing sms_history table first
        console.log('📋 Creating sms_history table...');
        const { error: smsTableError } = await supabase.rpc('exec_sql', {
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
        
        if (smsTableError) {
          console.log('⚠️  Could not create sms_history table via RPC');
        } else {
          console.log('✅ SMS history table created successfully');
        }
        
        // Try to fix RLS policies
        console.log('🔧 Attempting to fix RLS policies...');
        const { error: rlsError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Drop existing policies
            DROP POLICY IF EXISTS "Enable read access for all users" ON persons;
            DROP POLICY IF EXISTS "Enable insert access for all users" ON persons;
            DROP POLICY IF EXISTS "Enable update access for all users" ON persons;
            DROP POLICY IF EXISTS "Enable delete access for all users" ON persons;
            
            DROP POLICY IF EXISTS "Enable read access for all users" ON sms_history;
            DROP POLICY IF EXISTS "Enable insert access for all users" ON sms_history;
            
            -- Create comprehensive policies
            CREATE POLICY "Allow all operations for persons" ON persons FOR ALL USING (true) WITH CHECK (true);
            CREATE POLICY "Allow all operations for sms_history" ON sms_history FOR ALL USING (true) WITH CHECK (true);
          `
        });
        
        if (rlsError) {
          console.error('❌ Could not fix RLS policies via RPC:', rlsError.message);
          console.log('\n💡 Manual fix required:');
          console.log('Please run the fix-rls-policies.sql file in your Supabase SQL Editor');
        } else {
          console.log('✅ RLS policies fixed successfully');
        }
      }
    } else {
      console.log('✅ Persons table is accessible');
    }
    
    // Test if we can access the sms_history table
    console.log('📋 Testing sms_history table access...');
    const { data: smsTest, error: smsError } = await supabase
      .from('sms_history')
      .select('id')
      .limit(1);
    
    if (smsError) {
      console.error('❌ Error accessing sms_history table:', smsError.message);
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
    
    console.log('\n🎉 RLS policy check completed!');
    
  } catch (error) {
    console.error('❌ Error during RLS policy fix:', error);
    console.log('\n💡 Manual setup required:');
    console.log('Please run the fix-rls-policies.sql file in your Supabase SQL Editor');
  }
}

fixRLSPolicies(); 