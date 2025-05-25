const express = require('express');
const router = express.Router();
const xata = require('../config/xataClient');

router.post('/', async (req, res) => {
  const { name, mobile } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile number are required' });
  }

  try {
    const response = await xata.post('/tables/subscribers/data', {
      name,
      mobile,
      subscribed_at: new Date().toISOString()
    });

    return res.status(201).json(response.data);
  } catch (err) {
    console.error('❌ Subscriber creation error:', err.message);
    return res.status(500).json({ 
      error: 'Failed to subscribe', 
      details: err.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const response = await xata.post('/tables/subscribers/query', {});
    return res.status(200).json(response.data.records);
  } catch (err) {
    console.error('❌ Failed to fetch subscribers:', err.message);
    return res.status(500).json({ 
      error: 'Failed to fetch subscribers', 
      details: err.message 
    });
  }
});

module.exports = router;
