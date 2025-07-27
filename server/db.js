import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;
try {
  db = new Database(join(__dirname, "database.sqlite"));
  console.log("Database connected successfully");
} catch (error) {
  console.error("Error connecting to database:", error);
  throw error;
}

// Initialize database tables
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      list_number TEXT NOT NULL UNIQUE,
      receipt_number TEXT NOT NULL,
      register_number TEXT NOT NULL,
      request_name TEXT NOT NULL,
      files TEXT
    );

    CREATE TABLE IF NOT EXISTS sms_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_number TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      delivery_status TEXT NOT NULL,
      error TEXT,
      sent_at TEXT NOT NULL
    );
  `);
  console.log("Database tables initialized successfully");
} catch (error) {
  console.error("Error initializing database tables:", error);
  throw error;
}

export class DbService {
  // Person methods
  async getAllPersons() {
    try {
      console.log("Starting getAllPersons...");
      return new Promise((resolve, reject) => {
        try {
          console.log("Executing SQL query...");
          const persons = db
            .prepare("SELECT * FROM persons ORDER BY date DESC")
            .all();
          console.log(
            "Query executed successfully, found",
            persons.length,
            "persons"
          );
          resolve(persons);
        } catch (error) {
          console.error("Error executing SQL query:", error);
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in getAllPersons:", error);
      throw error;
    }
  }

  async getPersonById(id) {
    try {
      return new Promise((resolve, reject) => {
        try {
          const person = db
            .prepare("SELECT * FROM persons WHERE id = ?")
            .get(id);
          resolve(person);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in getPersonById:", error);
      throw error;
    }
  }

  async getPersonByListNumber(listNumber) {
    try {
      return new Promise((resolve, reject) => {
        try {
          const person = db
            .prepare("SELECT * FROM persons WHERE list_number = ?")
            .get(listNumber);
          resolve(person);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in getPersonByListNumber:", error);
      throw error;
    }
  }

  async searchPersons(term) {
    try {
      return new Promise((resolve, reject) => {
        try {
          const searchTerm = `%${term}%`;
          const results = db
            .prepare(
              `
            SELECT * FROM persons 
            WHERE name LIKE ? 
            OR phone LIKE ? 
            OR list_number LIKE ? 
            OR receipt_number LIKE ? 
            OR register_number LIKE ?
            OR request_name LIKE ?
          `
            )
            .all(
              searchTerm,
              searchTerm,
              searchTerm,
              searchTerm,
              searchTerm,
              searchTerm
            );
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in searchPersons:", error);
      throw error;
    }
  }

  async addPerson(person) {
    try {
      return new Promise((resolve, reject) => {
        try {
          const stmt = db.prepare(`
            INSERT INTO persons (name, phone, date, status, list_number, receipt_number, register_number, request_name, files)
            VALUES (@name, @phone, @date, @status, @list_number, @receipt_number, @register_number, @request_name, @files)
          `);

          const result = stmt.run(person);
          const newPerson = this.getPersonById(result.lastInsertRowid);
          resolve(newPerson);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in addPerson:", error);
      throw error;
    }
  }

  async updatePerson(person) {
    try {
      return new Promise((resolve, reject) => {
        try {
          const stmt = db.prepare(`
            UPDATE persons 
            SET name = @name,
                phone = @phone,
                status = @status,
                receipt_number = @receipt_number,
                register_number = @register_number,
                request_name = @request_name,
                files = @files
            WHERE id = @id
          `);

          stmt.run(person);
          const updatedPerson = this.getPersonById(person.id);
          resolve(updatedPerson);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in updatePerson:", error);
      throw error;
    }
  }

  updateStatus(criteria, value, status) {
    try {
      let field;
      switch (criteria) {
        case "قائمة":
          field = "list_number";
          break;
        case "وصل":
          field = "receipt_number";
          break;
        case "دفتر":
          field = "register_number";
          break;
        default:
          throw new Error("Invalid criteria");
      }

      const stmt = db.prepare(`
        UPDATE persons 
        SET status = ?
        WHERE ${field} = ?
        RETURNING *
      `);

      return stmt.all(status, value);
    } catch (error) {
      console.error("Error in updateStatus:", error);
      throw error;
    }
  }

  async deletePerson(listNumber) {
    try {
      return new Promise((resolve, reject) => {
        try {
          const result = db
            .prepare("DELETE FROM persons WHERE list_number = ?")
            .run(listNumber);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error in deletePerson:", error);
      throw error;
    }
  }

  // SMS History methods
  async getSmsHistoryByMessage(to, message) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM sms_history 
        WHERE to_number = ? AND message = ? 
        AND sent_at > datetime('now', '-1 hour')
      `);
      return stmt.all(to, message);
    } catch (error) {
      console.error("Error in getSmsHistoryByMessage:", error);
      throw error;
    }
  }

  async addSmsHistory(entry) {
    try {
      const { to_number, message, status, delivery_status, error, sent_at } =
        entry;

      const stmt = db.prepare(`
        INSERT INTO sms_history (
          to_number, message, status, delivery_status, error, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        to_number,
        message,
        status,
        delivery_status,
        error,
        sent_at
      );
      return { id: result.lastInsertRowid, ...entry };
    } catch (error) {
      console.error("Error in addSmsHistory:", error);
      throw error;
    }
  }

  getSmsHistory() {
    try {
      return db
        .prepare("SELECT * FROM sms_history ORDER BY sent_at DESC")
        .all();
    } catch (error) {
      console.error("Error in getSmsHistory:", error);
      throw error;
    }
  }

  checkDuplicateSms(id) {
    try {
      return (
        db.prepare("SELECT 1 FROM sms_history WHERE id = ?").get(id) !==
        undefined
      );
    } catch (error) {
      console.error("Error in checkDuplicateSms:", error);
      throw error;
    }
  }

  async updatePersonStatus(personId, status) {
    try {
      const stmt = db.prepare(`
        UPDATE persons 
        SET status = ? 
        WHERE id = ?
      `);

      const result = stmt.run(status, personId);

      if (result.changes === 0) {
        return null;
      }

      // Get the updated person
      const updatedPerson = db
        .prepare(
          `
        SELECT * FROM persons 
        WHERE id = ?
      `
        )
        .get(personId);

      return updatedPerson;
    } catch (error) {
      console.error("Error in updatePersonStatus:", error);
      throw error;
    }
  }
}
