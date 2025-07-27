import { SupabaseDbService } from '../supabase-db.js';

const db = new SupabaseDbService();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;

  console.log(`🔧 DELETE API Request: /api/persons/delete?id=${id}`);

  try {
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    console.log(`🔧 Deleting person with ID: ${id}`);
    await db.deletePerson(id);
    res.status(200).json({ success: true, message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error in delete API:', error);
    res.status(500).json({ error: error.message });
  }
} 