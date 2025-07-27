import { PostgresDbService } from '../postgres-db.js';

const db = new PostgresDbService();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const person = await db.getPersonById(id);
        if (!person) {
          return res.status(404).json({ error: 'Person not found' });
        }
        res.status(200).json(person);
        break;
      
      case 'PUT':
        const updatedPerson = await db.updatePerson({ ...req.body, id });
        res.status(200).json(updatedPerson);
        break;
      
      case 'DELETE':
        await db.deletePerson(id);
        res.status(200).json({ success: true });
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in person API:', error);
    res.status(500).json({ error: error.message });
  }
} 