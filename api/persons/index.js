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
      
      case 'PUT':
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'ID parameter is required for PUT' });
        }
        console.log(`🔧 Updating person with ID: ${id}`);
        const updatedPerson = await db.updatePerson({ ...req.body, id });
        res.status(200).json(updatedPerson);
        break;
      
      case 'DELETE':
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'ID parameter is required for DELETE' });
        }
        console.log(`🔧 API DELETE: Deleting person with ID: ${deleteId}`);
        console.log(`🔧 API DELETE: Query parameters:`, req.query);
        console.log(`🔧 API DELETE: Request body:`, req.body);
        
        try {
          const result = await db.deletePerson(deleteId);
          console.log(`🔧 API DELETE: Delete result:`, result);
          res.status(200).json({ success: true, message: 'Person deleted successfully' });
        } catch (error) {
          console.error(`🔧 API DELETE: Error deleting person:`, error);
          res.status(500).json({ error: error.message });
        }
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in persons API:', error);
    res.status(500).json({ error: error.message });
  }
} 