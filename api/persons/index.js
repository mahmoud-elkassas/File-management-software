import { PostgresDbService } from '../postgres-db.js';

const db = new PostgresDbService();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Initialize database if tables don't exist
    try {
      await db.initDatabase();
    } catch (initError) {
      console.log('Database already initialized or error:', initError.message);
    }

    switch (req.method) {
      case 'GET':
        const persons = await db.getAllPersons();
        res.status(200).json(persons);
        break;
      
      case 'POST':
        const person = await db.addPerson(req.body);
        res.status(201).json(person);
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in persons API:', error);
    res.status(500).json({ error: error.message });
  }
} 