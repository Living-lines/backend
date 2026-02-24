const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // your pg connection
const { uploader, uploadToSpaces } = require('../utils/upload');

const TABLE = 'product';

router.get('/', async (req, res) => {
  try {
    const { brand, product_type, search, model, model_name, series } = req.query;

    let conditions = [];
    let values = [];
    let index = 1;

    if (brand) {
      conditions.push(`brand = $${index++}`);
      values.push(brand);
    }

    if (product_type) {
      conditions.push(`product_type = $${index++}`);
      values.push(product_type);
    }

    if (model || model_name) {
      conditions.push(`model_name = $${index++}`);
      values.push(model || model_name);
    }

    if (series) {
      conditions.push(`series = $${index++}`);
      values.push(series);
    }

    if (search) {
      conditions.push(`(
        brand ILIKE $${index}
        OR product_type ILIKE $${index}
        OR description ILIKE $${index}
        OR model_name ILIKE $${index}
        OR series ILIKE $${index}
      )`);
      values.push(`%${search}%`);
      index++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const query = `
      SELECT * FROM product
      ${whereClause}
      ORDER BY xata_createdat DESC
    `;

    const result = await pool.query(query, values);
    res.json(
      result.rows.map(p => ({
        id: p.xata_id,                         // ✅ old id
        name: p.model_name || p.name || '',    // ✅ old name
        brand: p.brand,
        type: p.product_type,                  // ✅ old type
        image: Array.isArray(p.images) ? p.images[0] : p.images, // ✅ old image
        series: p.series,
        description: p.description,
        tilestype: p.tilestype,
        model_name: p.model_name,
        product_type: p.product_type,
        images: p.images
      }))
    );


  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
});


router.post('/', uploader.array('images', 15), async (req, res) => {
  try {
    const { brand, product_type, description, tilestype, model_name, series } = req.body;
    const files = req.files;

    if (!brand || !product_type || !description || !files?.length) {
      return res.status(400).json({
        error: 'brand, product_type, description and at least one image are required'
      });
    }

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

    const query = `
      INSERT INTO product 
      (brand, product_type, description, tilestype, model_name, series, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `;

    const values = [
      brand,
      product_type,
      description,
      product_type.toLowerCase() === 'tiles' ? tilestype : null,
      model_name || null,
      series || null,
      JSON.stringify(imageURLs)   // ✅ FIX
    ];


    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Failed to add product', details: err.message });
  }
});


router.put('/:id', uploader.array('images', 15), async (req, res) => {
  try {
    const id = req.params.id;
    const files = req.files || [];

    const existing = await pool.query(
      `SELECT * FROM product WHERE xata_id = $1`,
      [id]
    );

    if (!existing.rows.length)
      return res.status(404).json({ error: 'Product not found' });

    const product = existing.rows[0];
    let images = product.images || [];

    if (files.length > 0) {
      images = await Promise.all(
        files.map(f =>
          uploadToSpaces(
            f.buffer,
            f.originalname,
            f.mimetype,
            `products/${product.brand}/${product.product_type.replace(/\s+/g, '_')}`
          ).then(({ Location }) => Location)
        )
      );
    }

    const updateQuery = `
      UPDATE product SET
      brand = COALESCE($1, brand),
      product_type = COALESCE($2, product_type),
      description = COALESCE($3, description),
      model_name = COALESCE($4, model_name),
      series = COALESCE($5, series),
      tilestype = $6,
      images = $7
      WHERE xata_id = $8
      RETURNING *
    `;

    const values = [
      req.body.brand || null,
      req.body.product_type || null,
      req.body.description || null,
      req.body.model_name || null,
      req.body.series || null,
      req.body.product_type?.toLowerCase() === 'tiles'
        ? req.body.tilestype
        : null,
      JSON.stringify(images),
      id
    ];

    const result = await pool.query(updateQuery, values);
    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM product WHERE xata_id = $1`, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});


router.get('/tilestypes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT tilestype 
      FROM product 
      WHERE tilestype IS NOT NULL
    `);

    res.json(result.rows.map(r => r.tilestype));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tile types' });
  }
});


router.get('/series', async (req, res) => {
  try {
    const { brand } = req.query;

    const result = brand
      ? await pool.query(
        `SELECT DISTINCT series FROM product WHERE brand = $1 AND series IS NOT NULL`,
        [brand]
      )
      : await pool.query(
        `SELECT DISTINCT series FROM product WHERE series IS NOT NULL`
      );

    res.json(result.rows.map(r => r.series));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});


module.exports = router;
