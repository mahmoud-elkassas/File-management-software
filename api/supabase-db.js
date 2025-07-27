import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseDbService {
  constructor() {
    this.initDatabase();
  }

  async initDatabase() {
    try {
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

      console.log('Supabase tables initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase tables:', error);
    }
  }

  // Person methods
  async getAllPersons() {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getAllPersons:', error);
      throw error;
    }
  }

  async getPersonById(id) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getPersonById:', error);
      throw error;
    }
  }

  async getPersonByListNumber(listNumber) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('list_number', listNumber)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getPersonByListNumber:', error);
      throw error;
    }
  }

  async searchPersons(term) {
    try {
      const searchTerm = `%${term}%`;
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},list_number.ilike.${searchTerm},receipt_number.ilike.${searchTerm},register_number.ilike.${searchTerm},request_name.ilike.${searchTerm}`)
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in searchPersons:', error);
      throw error;
    }
  }

  async addPerson(personData) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .insert([{
          name: personData.name,
          phone: personData.phone,
          date: personData.date || new Date().toISOString().split('T')[0],
          status: personData.status,
          list_number: personData.list_number,
          receipt_number: personData.receipt_number,
          register_number: personData.register_number,
          request_name: personData.request_name,
          files: personData.files || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addPerson:', error);
      throw error;
    }
  }

  async updatePerson(personData) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .update({
          name: personData.name,
          phone: personData.phone,
          date: personData.date,
          status: personData.status,
          list_number: personData.list_number,
          receipt_number: personData.receipt_number,
          register_number: personData.register_number,
          request_name: personData.request_name,
          files: personData.files || null
        })
        .eq('id', personData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updatePerson:', error);
      throw error;
    }
  }

  async updateStatus(criteria, value, status) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .update({ status })
        .eq(criteria, value)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw error;
    }
  }

  async deletePerson(listNumber) {
    try {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('list_number', listNumber);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error in deletePerson:', error);
      throw error;
    }
  }

  async updatePersonStatus(personId, status) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .update({ status })
        .eq('id', personId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updatePersonStatus:', error);
      throw error;
    }
  }

  // SMS methods
  async addSmsHistory(entry) {
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .insert([{
          to_number: entry.to_number,
          message: entry.message,
          status: entry.status,
          delivery_status: entry.delivery_status,
          error: entry.error || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addSmsHistory:', error);
      throw error;
    }
  }

  async getSmsHistory() {
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getSmsHistory:', error);
      throw error;
    }
  }

  async getSmsHistoryByMessage(to, message) {
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .select('*')
        .eq('to_number', to)
        .eq('message', message)
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getSmsHistoryByMessage:', error);
      throw error;
    }
  }

  async checkDuplicateSms(to) {
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .select('id')
        .eq('to_number', to)
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error in checkDuplicateSms:', error);
      throw error;
    }
  }
} 