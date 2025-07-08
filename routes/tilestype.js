const express = require('express');
const router = express.Router();
const xata = require('../config/xataClient');

const TABLE = 'tilestype';
router.get('/', async (req, res) => {
  try {
    const { data } = await xata.post(`/tables/${TABLE}/query`, {});
    const tileTypes = data.records.map(r => r.name);
    res.status(200).json(tileTypes);
  } catch (err) {
    console.error('🚨 TilesType fetch error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch tile types', details: err.message });
  }
});

module.exports = router;
