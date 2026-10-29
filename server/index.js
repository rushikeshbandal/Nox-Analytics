import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import limkarRouter from './limkarRoutes.js';

const { Pool } = pkg;

// Create PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  password: 'postgres123',  // Change to your actual password
  host: 'localhost',
  port: 5432,
  database: 'nox_analytics',
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/limkar', limkarRouter);

// Create table if not exists
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS palettes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    department VARCHAR(100),
    primary_colors TEXT[] NOT NULL,
    secondary_colors TEXT[] NOT NULL,
    accent_colors TEXT[] NOT NULL,
    text_colors TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

// Initialize database table
async function initDatabase() {
  try {
    await pool.query(createTableQuery);
    console.log('✅ Table "palettes" is ready');
  } catch (err) {
    console.error('Error creating table:', err.message);
  }
}

initDatabase();

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running on port 3001!' });
});

// GET - Fetch all palettes
app.get('/api/palettes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM palettes ORDER BY created_at DESC'
    );
    
    // Convert database column names to camelCase
    const palettes = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      industry: row.industry,
      department: row.department,
      primaryColors: row.primary_colors,
      secondaryColors: row.secondary_colors,
      accentColors: row.accent_colors,
      textColors: row.text_colors,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(palettes);
  } catch (error) {
    console.error('Error fetching palettes:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Create a new palette
app.post('/api/palettes', async (req, res) => {
  try {
    const { 
      name, 
      industry, 
      department, 
      primaryColors, 
      secondaryColors, 
      accentColors, 
      textColors 
    } = req.body;
    
    const query = `
      INSERT INTO palettes (name, industry, department, primary_colors, secondary_colors, accent_colors, text_colors)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      name,
      industry || null,
      department || null,
      primaryColors || ['#6366ff', '#4f46e5', '#818cf8'],
      secondaryColors || ['#e0e7ff', '#c7d2fe'],
      accentColors || ['#22c55e'],
      textColors || ['#1e293b', '#ffffff']
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    const palette = {
      id: row.id.toString(),
      name: row.name,
      industry: row.industry,
      department: row.department,
      primaryColors: row.primary_colors,
      secondaryColors: row.secondary_colors,
      accentColors: row.accent_colors,
      textColors: row.text_colors,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.status(201).json(palette);
  } catch (error) {
    console.error('Error creating palette:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update a palette
app.put('/api/palettes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { primaryColors, secondaryColors, accentColors, textColors } = req.body;
    
    const query = `
      UPDATE palettes 
      SET primary_colors = $1, secondary_colors = $2, accent_colors = $3, text_colors = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [primaryColors, secondaryColors, accentColors, textColors, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Palette not found' });
    }
    
    const row = result.rows[0];
    const palette = {
      id: row.id.toString(),
      name: row.name,
      industry: row.industry,
      department: row.department,
      primaryColors: row.primary_colors,
      secondaryColors: row.secondary_colors,
      accentColors: row.accent_colors,
      textColors: row.text_colors,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(palette);
  } catch (error) {
    console.error('Error updating palette:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete a palette
app.delete('/api/palettes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM palettes WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Palette not found' });
    }
    
    res.json({ message: 'Palette deleted successfully' });
  } catch (error) {
    console.error('Error deleting palette:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/health`);
  console.log(`📊 Database: PostgreSQL\n`);
});