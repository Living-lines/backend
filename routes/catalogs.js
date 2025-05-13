// routes/catalogs.js
const express = require('express');
const router  = express.Router();
//const { upload, uploadToSpaces } = require('../utils/upload');
const { pdfUpload, uploadToSpaces } = require('../utils/upload');


const xata    = require('../config/xataClient');

// GET all catalogs
router.get('/', async (req, res) => {
  try {
    const response = await xata.post(
      '/tables/catalogs/query',   // ← use query instead of GET /data
      {}                           // empty body returns all rows
    );
    res.json(response.data.records);
  } catch (err) {
    console.error("Get Catalogs Error:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch catalogs', details: err.message });
  }
});

// POST new catalog (unchanged)
router.post('/', pdfUpload, async (req, res) => {
  try {
    const { title } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'Title and file are required' });
    }

    const { Location: pdfUrl } = await uploadToSpaces(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'catalogs'
    );

    const response = await xata.post(
      '/tables/catalogs/data',
      { title, pdf_url: pdfUrl }
    );
    res.status(201).json(response.data);
  } catch (err) {
    console.error("PDF Upload Error:", err);
    res.status(500).json({ error: 'Failed to upload catalog PDF', details: err.message });
  }
});

module.exports = router;
