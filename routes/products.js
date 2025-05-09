// /routes/products.js
const express = require('express');
const router  = express.Router();
const xata    = require('../config/xataClient');
const { upload, uploadToSpaces } = require('../utils/upload');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { data } = await xata.post('/tables/products/query', {});
    return res.json(data.records);
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch products',
      details: err.message
    });
  }
});

// POST /api/products
router.post('/', upload, async (req, res) => {
  try {
    const { brand, model_name, product_type } = req.body;
    const file = req.file;

    if (!brand || !model_name || !product_type || !file) {
      return res.status(400).json({
        error: 'brand, model_name, product_type and image are all required'
      });
    }

    // upload to Spaces under `products/<brand>/…`
    const { Location: image_url } = await uploadToSpaces(
      file.buffer,
      file.originalname,
      file.mimetype,
      `products/${brand}`
    );

    // save to Xata
    const { data } = await xata.post('/tables/products/data', {
      brand,
      model_name,
      product_type,
      image_url
    });

    return res.status(201).json(data);
  } catch (err) {
    console.error('🚨 Product upload error:', err);
    return res.status(500).json({
      error: 'Failed to add product',
      details: err.message
    });
  }
});

module.exports = router;
