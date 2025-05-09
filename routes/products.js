const express = require('express');
const router = express.Router();
const xata = require('../config/xataClient');

// GET all products
router.get('/', async (req, res) => {
  try {
    const response = await xata.post('/tables/products/query', {}); // empty body fetches all
    res.json(response.data.records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
});

router.post('/', async (req, res) => {
    try {
      const { brand, model_name, product_type, image_url } = req.body;
      console.log("Received:", req.body); // debug log
  
      const response = await xata.post('/tables/products/data', {
        brand,
        model_name,
        product_type,
        image_url
      });
  
      console.log("Xata response:", response.data); // success log
  
      res.status(201).json(response.data);
    } catch (err) {
      console.error("❌ Xata Error:", err.response?.data || err.message); // log full error
      res.status(500).json({
        error: 'Failed to add product',
        details: err.response?.data?.message || err.message
      });
    }
  });
  
module.exports = router;
