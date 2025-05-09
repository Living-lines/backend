const express = require('express');
const router = express.Router();
const xata = require('../config/xataClient');

// GET all quote requests
router.get('/', async (req, res) => {
  try {
    const response = await xata.post('/tables/quote_requests/query', {});
    res.json(response.data.records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes', details: err.message });
  }
});

// POST new quote request
router.post('/', async (req, res) => {
  try {
    const {
      name, email, phone,
      product_id, product_name, product_brand,
      product_type, image_url
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
      requested_at: new Date().toISOString()
    });

    res.status(201).json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quote', details: err.message });
  }
});

module.exports = router;
