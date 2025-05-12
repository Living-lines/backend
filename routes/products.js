// routes/products.js

const express = require('express');
const router  = express.Router();
const xata    = require('../config/xataClient');
const { upload, uploadToSpaces } = require('../utils/upload');

// Capitalize first letter: "nike" → "Nike"
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// GET /api/products
// Query params:
//   • brand        exact match, case-insensitive via capitalize()
//   • product_type exact match (can apply same logic if needed)
//   • model_name   substring, case-sensitive
//   • search       substring across all three, case-insensitive via dual probes
router.get('/', async (req, res) => {
  try {
    const { brand, product_type, model_name, search } = req.query;
    const filter = {};

    // Exact-match brand, case-sensitive
    if (brand) {
      filter.brand = brand;
    }

    // Exact-match product_type (if you need case-insensitivity, apply capitalize here too)
    if (product_type) {
      filter.product_type = product_type;
    }

    // Substring match on model_name (case-sensitive)
    if (model_name) {
      filter.model_name = { $contains: model_name };
    }

    // Cross-field substring search (case-sensitive)
    if (search) {
      const cap = search;
      filter.$any = [
        { brand:        { $contains: search } },
        { brand:        { $contains: cap    } },
        { product_type: { $contains: search } },
        { product_type: { $contains: cap    } },
        { model_name:   { $contains: search } },
        { model_name:   { $contains: cap    } },
      ];
    }

    // Build request body only if we have any filters
    const body = Object.keys(filter).length ? { filter } : {};
    const { data } = await xata.post('/tables/products/query', body);
    return res.status(200).json(data.records);
  } catch (err) {
    console.error('🚨 Products Fetch Error:', err.response?.data || err.message);
    return res.status(500).json({
      error:   'Failed to fetch products',
      details: err.message
    });
  }
});

// POST /api/products
// multipart/form-data: brand, model_name, product_type + file (image)
router.post('/', upload, async (req, res) => {
  try {
    const { brand, model_name, product_type } = req.body;
    const file = req.file;

    if (!brand || !model_name || !product_type || !file) {
      return res.status(400).json({
        error: 'brand, model_name, product_type and image file are all required'
      });
    }

    // Upload the image to Spaces under products/<brand>/…
    const { Location: image_url } = await uploadToSpaces(
      file.buffer,
      file.originalname,
      file.mimetype,
      `products/${brand}`
    );

    // Save the record in Xata
    const { data } = await xata.post('/tables/products/data', {
      brand,
      model_name,
      product_type,
      image_url
    });

    return res.status(201).json(data);
  } catch (err) {
    console.error('🚨 Product Upload Error:', err);
    return res.status(500).json({
      error:   'Failed to add product',
      details: err.message
    });
  }
});

module.exports = router;
