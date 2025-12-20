const express = require('express');
const router = express.Router();
const xata = require('../config/xataClient');

// GET all quote requests
router.get('/', async (req, res) => {
  try {
    const response = await xata.post('/tables/quote_requests/query', {});
    res.json(response.data.records);
  } catch (err) {
    console.error('❌ GET /quotes error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch quotes', details: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const quoteId = req.params.id;
    await xata.delete(`/tables/quote_requests/data/${quoteId}`);
    res.sendStatus(204);
  } catch (err) {
    console.error('Failed to delete quote:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to delete quote', details: err.message });
  }
});


// POST new quote request
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
      selected_color // 👈 NEW (optional)
    } = req.body;

    const response = await xata.post('/tables/quote_requests/data', {
      name,
      email,
      phone,
      product_id,
      product_name,
      product_brand,
      product_type,
      image_url,
      selected_color: selected_color || null, // 👈 fail-safe
      requested_at: new Date().toISOString()
    });

    res.status(201).json(response.data);
  } catch (err) {
    console.error('❌ POST /quotes error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create quote', details: err.message });
  }
});



module.exports = router;
