import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Fetch all palettes
  if (req.method === 'GET') {
    try {
      const palettes = await prisma.palette.findMany({
        orderBy: { createdAt: 'desc' }
      });
      console.log(`📋 Returning ${palettes.length} palettes`);
      return res.status(200).json(palettes);
    } catch (error) {
      console.error('GET Error:', error);
      return res.status(500).json({ error: 'Failed to fetch palettes', details: error.message });
    }
  }
  
  // POST - Create a new palette
  if (req.method === 'POST') {
    try {
      const { name, industry, department, primaryColors, secondaryColors, accentColors, textColors } = req.body;
      
      console.log('📝 Received POST request to create palette:', name);
      console.log('   Colors:', primaryColors);
      
      const palette = await prisma.palette.create({
        data: {
          name,
          industry: industry || null,
          department: department || null,
          primaryColors: primaryColors || ['#6366ff', '#4f46e5', '#818cf8'],
          secondaryColors: secondaryColors || ['#e0e7ff', '#c7d2fe'],
          accentColors: accentColors || ['#22c55e'],
          textColors: textColors || ['#1e293b', '#ffffff']
        }
      });
      
      console.log('✅ Palette created successfully with ID:', palette.id);
      return res.status(201).json(palette);
    } catch (error) {
      console.error('POST Error:', error);
      return res.status(500).json({ error: 'Failed to create palette', details: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}