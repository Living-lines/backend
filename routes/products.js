// routes/product.js  –  mount as /api/product
const express = require('express');
const router  = express.Router();
const xata    = require('../config/xataClient');
const { uploader, uploadToSpaces } = require('../utils/upload');  // ← generic Multer

const TABLE = 'product';   // columns: id, brand, product_type, description, images (TEXT[])

/* ─────────────────────────── GET /api/product ──────────────────────────
   Supports ?brand=Jaquar&product_type=Commode&search=keyword            */
router.get('/', async (req, res) => {
  try {
    const { brand, product_type, search } = req.query;
    const filter = {};

    if (brand)        filter.brand        = brand;
    if (product_type) filter.product_type = product_type;

    if (search) {
      filter.$any = [
        { brand:        { $contains: search } },
        { product_type: { $contains: search } },
        { description:  { $contains: search } }
      ];
    }

    const body     = Object.keys(filter).length ? { filter } : {};
    const { data } = await xata.post(`/tables/${TABLE}/query`, body);
    res.status(200).json(data.records);
  } catch (err) {
    console.error('🚨 Product fetch error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
});

/* ─────────────────────────── POST /api/product ─────────────────────────
   multipart/form-data:
     • brand
     • product_type
     • description
     • images[]   (1-8 files)
     • tilestype  (optional, only if product_type === "Tiles")            */
router.post(
  '/',
  uploader.array('images', 8),                       // accept up to 8 images
  async (req, res) => {
    try {
      const { brand, product_type, description, tilestype } = req.body;
      const files = req.files;

      if (!brand || !product_type || !description || !files?.length) {
        return res.status(400).json({
          error: 'brand, product_type, description and at least one image are required'
        });
      }

      // Upload each image to DigitalOcean Spaces / S3
      const imageURLs = await Promise.all(
        files.map(f =>
          uploadToSpaces(
            f.buffer,
            f.originalname,
            f.mimetype,
            `products/${brand}/${product_type.replace(/\s+/g, '_')}`
          ).then(({ Location }) => Location)
        )
      );

      // Build record for Xata
      const record = {
        brand,
        product_type,
        description,
        images: imageURLs
      };

      if (product_type.toLowerCase() === 'tiles' && tilestype) {
        record.tilestype = tilestype;
      }

      const { data } = await xata.post(`/tables/${TABLE}/data`, record);
      res.status(201).json(data);
    } catch (err) {
      console.error('🚨 Product upload error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to add product', details: err.message });
    }
  }
);

/* ───────────────────────── DELETE /api/product/:id ──────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    await xata.delete(`/tables/${TABLE}/data/${req.params.id}`);
    res.sendStatus(204);
  } catch (err) {
    console.error('🚨 Delete error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});






/* ───────────── GET /api/product/tilestypes ──────────────*/
router.get('/tilestypes', async (req, res) => {
  try {
    const { data } = await xata.post(`/tables/${TABLE}/query`, {});
    const records = data.records || [];
    const tileTypes = [...new Set(records.map(item => item.tilestype).filter(Boolean))];
    res.status(200).json(tileTypes);
  } catch (err) {
    console.error('🚨 Product tilestype fetch error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch tile types', details: err.message });
  }
});


module.exports = router;
