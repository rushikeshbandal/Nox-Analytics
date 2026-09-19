import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  
  // PUT - Update palette
  if (req.method === 'PUT') {
    try {
      const { primaryColors, secondaryColors, accentColors, textColors } = req.body;
      
      console.log('✏️ Updating palette:', id);
      
      const updated = await prisma.palette.update({
        where: { id },
        data: {
          primaryColors,
          secondaryColors,
          accentColors,
          textColors,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Palette updated successfully');
      return res.status(200).json(updated);
    } catch (error) {
      console.error('PUT Error:', error);
      return res.status(500).json({ error: 'Failed to update palette' });
    }
  }
  
  // DELETE - Delete palette
  if (req.method === 'DELETE') {
    try {
      console.log('🗑️ Deleting palette:', id);
      
      await prisma.palette.delete({ where: { id } });
      
      console.log('✅ Palette deleted successfully');
      return res.status(200).json({ message: 'Palette deleted successfully' });
    } catch (error) {
      console.error('DELETE Error:', error);
      return res.status(500).json({ error: 'Failed to delete palette' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}