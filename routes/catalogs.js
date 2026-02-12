const express = require('express');
const router  = express.Router();
const { catalogUpload, uploadToSpaces } = require('../utils/upload');
const pool    = require('../config/db'); // ✅ use postgres

// =============================
// GET ALL CATALOGS
// =============================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM catalogs
      ORDER BY xata_createdat DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Get Catalogs Error:", err);
    res.status(500).json({ 
      error: 'Failed to fetch catalogs', 
      details: err.message 
    });
  }
});


// =============================
// CREATE NEW CATALOG
// =============================
router.post('/', catalogUpload, async (req, res) => {
  try {
    const { title } = req.body;
    const pdfFile   = req.files.file?.[0];   // PDF field name = "file"
    const imgFile   = req.files.image?.[0];  // image field name = "image"

    if (!title || !pdfFile) {
      return res.status(400).json({ 
        error: 'Title and PDF file are required' 
      });
    }

    // Upload PDF
    const { Location: pdf_url } = await uploadToSpaces(
      pdfFile.buffer,
      pdfFile.originalname,
      pdfFile.mimetype,
      'catalogs'
    );

    // Upload image (optional)
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

    // Insert into PostgreSQL
    const insertQuery = `
      INSERT INTO catalogs (title, pdf_url, image_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [title, pdf_url, image_url];

    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Catalog Upload Error:", err);
    res.status(500).json({ 
      error: 'Failed to upload catalog', 
      details: err.message 
    });
  }
});


// =============================
// DELETE CATALOG
// =============================
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query(
      `DELETE FROM catalogs WHERE xata_id = $1`,
      [id]
    );

    res.sendStatus(204);

  } catch (err) {
    console.error("Delete Catalog Error:", err);
    res.status(500).json({ 
      error: 'Failed to delete catalog',
      details: err.message
    });
  }
});


module.exports = router;
