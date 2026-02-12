const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// =============================
// GET ALL TILE TYPES
// =============================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT name
      FROM tilestype
      ORDER BY name ASC
    `);

    const tileTypes = result.rows.map(r => r.name);

    res.status(200).json(tileTypes);

  } catch (err) {
    console.error('🚨 TilesType fetch error:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch tile types', 
      details: err.message 
    });
  }
});

module.exports = router;
