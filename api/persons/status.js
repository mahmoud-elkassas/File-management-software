import { SupabaseDbService } from '../supabase-db.js';

const db = new SupabaseDbService();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { criteria, value, status } = req.body;
    const updatedPersons = await db.updateStatus(criteria, value, status);
    res.json(updatedPersons);
  } catch (error) {
    console.error('Error in status update:', error);
    res.status(500).json({ error: error.message });
  }
} 