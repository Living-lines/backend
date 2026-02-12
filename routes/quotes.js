const express = require('express');
const router = express.Router();
const pool = require('../config/db');


// =============================
// GET ALL QUOTE REQUESTS
// =============================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM quote_requests
      ORDER BY xata_createdat DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error('❌ GET /quotes error:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch quotes', 
      details: err.message 
    });
  }
});


// =============================
// DELETE QUOTE REQUEST
// =============================
router.delete('/:id', async (req, res) => {
  try {
    const quoteId = req.params.id;

    await pool.query(
      `DELETE FROM quote_requests WHERE xata_id = $1`,
      [quoteId]
    );

    res.sendStatus(204);

  } catch (err) {
    console.error('Failed to delete quote:', err.message);
    res.status(500).json({ 
      error: 'Failed to delete quote', 
      details: err.message 
    });
  }
});


// =============================
// CREATE NEW QUOTE REQUEST
// =============================
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      product_id,
      product_name,
      product_brand,
      product_type,
      image_url,
      selected_color
    } = req.body;

    if (!name || !email || !product_id) {
      return res.status(400).json({
        error: 'name, email and product_id are required'
      });
    }

    const insertQuery = `
      INSERT INTO quote_requests (
        name,
        email,
        phone,
        product_id,
        product_name,
        product_brand,
        product_type,
        image_url,
        selected_color,
        requested_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;

    const values = [
      name,
      email,
      phone || null,
      product_id,
      product_name || null,
      product_brand || null,
      product_type || null,
      image_url || null,
      selected_color || null,
      new Date() // timestamp without time zone
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('❌ POST /quotes error:', err.message);
    res.status(500).json({ 
      error: 'Failed to create quote', 
      details: err.message 
    });
  }
});


module.exports = router;
