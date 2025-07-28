import { SupabaseDbService } from '../supabase-db.js';

const db = new SupabaseDbService();

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
    // Supabase handles table creation automatically

    switch (req.method) {
      case 'GET':
        const persons = await db.getAllPersons();
        res.status(200).json(persons);
        break;
      
      case 'POST':
        const person = await db.addPerson(req.body);
        res.status(201).json(person);
        break;
      
      case 'DELETE':
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'ID parameter is required for DELETE' });
        }
        console.log(`🔧 Deleting person with ID: ${id}`);
        await db.deletePerson(id);
        res.status(200).json({ success: true, message: 'Person deleted successfully' });
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in persons API:', error);
    res.status(500).json({ error: error.message });
  }
} 