const express = require('express');
const router  = express.Router();
const { catalogUpload, uploadToSpaces } = require('../utils/upload');
const xata    = require('../config/xataClient');

// GET all catalogs (unchanged)...
router.get('/', async (req, res) => {
  try {
    const response = await xata.post('/tables/catalogs/query', {});
    res.json(response.data.records);
  } catch (err) {
    console.error("Get Catalogs Error:", err);
    res.status(500).json({ error: 'Failed to fetch catalogs', details: err.message });
  }
});

// POST new catalog — now using field 'file' for PDF:
router.post('/', catalogUpload, async (req, res) => {
  try {
    const { title } = req.body;
    const pdfFile   = req.files.file?.[0];    // ← look for 'file' here
    const imgFile   = req.files.image?.[0];

    if (!title || !pdfFile) {
      return res.status(400).json({ error: 'Title and PDF file are required' });
    }

    // upload PDF
    const { Location: pdf_url } = await uploadToSpaces(
      pdfFile.buffer,
      pdfFile.originalname,
      pdfFile.mimetype,
      'catalogs'
    );

    // upload image if provided
    let image_url = null;
    if (imgFile) {
      const { Location } = await uploadToSpaces(
        imgFile.buffer,
        imgFile.originalname,
        imgFile.mimetype,
        'catalogs'
      );
      image_url = Location;
    }

    // persist both URLs
    const response = await xata.post(
      '/tables/catalogs/data',
      { title, pdf_url, image_url }
    );

    res.status(201).json(response.data);
  } catch (err) {
    console.error("Catalog Upload Error:", err);
    res.status(500).json({ error: 'Failed to upload catalog', details: err.message });
  }
});

module.exports = router;
