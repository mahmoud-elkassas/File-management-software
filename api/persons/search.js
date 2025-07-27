import { DbService } from '../db.js';

const db = new DbService();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { term } = req.query;
    if (!term) {
      return res.json([]);
    }
    const results = await db.searchPersons(term);
    res.json(results || []);
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: error.message });
  }
} 