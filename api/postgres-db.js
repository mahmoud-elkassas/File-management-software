import { sql } from '@vercel/postgres';

export class PostgresDbService {
  constructor() {
    this.initDatabase();
  }

  async initDatabase() {
    try {
      // Create persons table
      await sql`
        CREATE TABLE IF NOT EXISTS persons (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          date DATE NOT NULL,
          status VARCHAR(100) NOT NULL,
          list_number VARCHAR(100) NOT NULL UNIQUE,
          receipt_number VARCHAR(100) NOT NULL,
          register_number VARCHAR(100) NOT NULL,
          request_name VARCHAR(255) NOT NULL,
          files TEXT
        );
      `;

      // Create sms_history table
      await sql`
        CREATE TABLE IF NOT EXISTS sms_history (
          id SERIAL PRIMARY KEY,
          to_number VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          delivery_status VARCHAR(50) NOT NULL,
          error TEXT,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      console.log('PostgreSQL tables initialized successfully');
    } catch (error) {
      console.error('Error initializing PostgreSQL tables:', error);
    }
  }

  // Person methods
  async getAllPersons() {
    try {
      const result = await sql`
        SELECT * FROM persons 
        ORDER BY date DESC, id DESC
      `;
      return result.rows;
    } catch (error) {
      console.error('Error in getAllPersons:', error);
      throw error;
    }
  }

  async getPersonById(id) {
    try {
      const result = await sql`
        SELECT * FROM persons WHERE id = ${id}
      `;
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getPersonById:', error);
      throw error;
    }
  }

  async getPersonByListNumber(listNumber) {
    try {
      const result = await sql`
        SELECT * FROM persons WHERE list_number = ${listNumber}
      `;
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getPersonByListNumber:', error);
      throw error;
    }
  }

  async searchPersons(term) {
    try {
      const searchTerm = `%${term}%`;
      const result = await sql`
        SELECT * FROM persons 
        WHERE 
          name ILIKE ${searchTerm} OR
          phone ILIKE ${searchTerm} OR
          list_number ILIKE ${searchTerm} OR
          receipt_number ILIKE ${searchTerm} OR
          register_number ILIKE ${searchTerm} OR
          request_name ILIKE ${searchTerm}
        ORDER BY date DESC, id DESC
      `;
      return result.rows;
    } catch (error) {
      console.error('Error in searchPersons:', error);
      throw error;
    }
  }

  async addPerson(personData) {
    try {
      const result = await sql`
        INSERT INTO persons (
          name, phone, date, status, list_number, 
          receipt_number, register_number, request_name, files
        ) VALUES (
          ${personData.name},
          ${personData.phone},
          ${personData.date || new Date().toISOString().split('T')[0]},
          ${personData.status},
          ${personData.list_number},
          ${personData.receipt_number},
          ${personData.register_number},
          ${personData.request_name},
          ${personData.files || null}
        ) RETURNING *
      `;
      return result.rows[0];
    } catch (error) {
      console.error('Error in addPerson:', error);
      throw error;
    }
  }

  async updatePerson(personData) {
    try {
      const result = await sql`
        UPDATE persons SET
          name = ${personData.name},
          phone = ${personData.phone},
          date = ${personData.date},
          status = ${personData.status},
          list_number = ${personData.list_number},
          receipt_number = ${personData.receipt_number},
          register_number = ${personData.register_number},
          request_name = ${personData.request_name},
          files = ${personData.files || null}
        WHERE id = ${personData.id}
        RETURNING *
      `;
      
      if (result.rows.length === 0) {
        throw new Error('Person not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in updatePerson:', error);
      throw error;
    }
  }

  async updateStatus(criteria, value, status) {
    try {
      const result = await sql`
        UPDATE persons 
        SET status = ${status}
        WHERE ${sql.unsafe(criteria)} = ${value}
        RETURNING *
      `;
      return result.rows;
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw error;
    }
  }

  async deletePerson(listNumber) {
    try {
      const result = await sql`
        DELETE FROM persons 
        WHERE list_number = ${listNumber}
        RETURNING id
      `;
      
      if (result.rows.length === 0) {
        throw new Error('Person not found');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deletePerson:', error);
      throw error;
    }
  }

  async updatePersonStatus(personId, status) {
    try {
      const result = await sql`
        UPDATE persons 
        SET status = ${status}
        WHERE id = ${personId}
        RETURNING *
      `;
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in updatePersonStatus:', error);
      throw error;
    }
  }

  // SMS methods
  async addSmsHistory(entry) {
    try {
      const result = await sql`
        INSERT INTO sms_history (
          to_number, message, status, delivery_status, error
        ) VALUES (
          ${entry.to_number},
          ${entry.message},
          ${entry.status},
          ${entry.delivery_status},
          ${entry.error || null}
        ) RETURNING *
      `;
      return result.rows[0];
    } catch (error) {
      console.error('Error in addSmsHistory:', error);
      throw error;
    }
  }

  async getSmsHistory() {
    try {
      const result = await sql`
        SELECT * FROM sms_history 
        ORDER BY sent_at DESC
      `;
      return result.rows;
    } catch (error) {
      console.error('Error in getSmsHistory:', error);
      throw error;
    }
  }

  async getSmsHistoryByMessage(to, message) {
    try {
      const result = await sql`
        SELECT * FROM sms_history 
        WHERE to_number = ${to} 
        AND message = ${message}
        AND sent_at > NOW() - INTERVAL '24 hours'
        ORDER BY sent_at DESC
        LIMIT 1
      `;
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getSmsHistoryByMessage:', error);
      throw error;
    }
  }

  async checkDuplicateSms(to) {
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM sms_history 
        WHERE to_number = ${to}
        AND sent_at > NOW() - INTERVAL '24 hours'
      `;
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error in checkDuplicateSms:', error);
      throw error;
    }
  }
} 