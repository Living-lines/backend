const express = require('express');
const router = express.Router();
const pool = require('../config/db');


// =============================
// CREATE SUBSCRIBER
// =============================
router.post('/', async (req, res) => {
  const { name, mobile } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ 
      error: 'Name and mobile number are required' 
    });
  }

  try {
    const insertQuery = `
      INSERT INTO subscribers (
        name,
        mobile,
        subscribed_at
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      name,
      mobile,
      new Date()
    ];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('❌ Subscriber creation error:', err.message);
    return res.status(500).json({ 
      error: 'Failed to subscribe', 
      details: err.message 
    });
  }
});


// =============================
// GET ALL SUBSCRIBERS
// =============================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM subscribers
      ORDER BY subscribed_at DESC
    `);

    return res.status(200).json(result.rows);

  } catch (err) {
    console.error('❌ Failed to fetch subscribers:', err.message);
    return res.status(500).json({ 
      error: 'Failed to fetch subscribers', 
      details: err.message 
    });
  }
});

module.exports = router;
