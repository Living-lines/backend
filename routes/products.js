const express = require('express');
const router = express.Router();
const xata = require('../config/xataClient');
const { uploader, uploadToSpaces } = require('../utils/upload');

const TABLE = 'product';

router.get('/', async (req, res) => {
  try {
    const { brand, product_type, search, model, model_name, series } = req.query;
    const filter = {};
    if (brand) filter.brand = brand;
    if (product_type) filter.product_type = product_type;
    if (model || model_name) filter.model_name = model || model_name;
    if (series) filter.series = series;
    if (search) {
      filter.$any = [
        { brand: { $contains: search } },
        { product_type: { $contains: search } },
        { description: { $contains: search } },
        { model_name: { $contains: search } },
        { series: { $contains: search } }
      ];
    }
    const PAGE_SIZE = 500;
    let page = 0;
    let allRecords = [];
    let hasMore = true;
    while (hasMore) {
      const body = Object.keys(filter).length ? { filter } : {};
      body.page = { size: PAGE_SIZE, offset: page * PAGE_SIZE };
      const { data } = await xata.post(`/tables/${TABLE}/query`, body);
      if (data && data.records && data.records.length > 0) {
        allRecords = allRecords.concat(data.records);
        if (data.records.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          page += 1;
        }
      } else {
        hasMore = false;
      }
    }
    res.status(200).json(allRecords);
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
    const record = {
      brand,
      product_type,
      description,
      images: imageURLs
    };
    if (model_name) record.model_name = model_name;
    if (series) record.series = series;
    if (product_type.toLowerCase() === 'tiles' && tilestype) {
      record.tilestype = tilestype;
    }
    const { data } = await xata.post(`/tables/${TABLE}/data`, record);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product', details: err.message });
  }
});

router.put('/:id', uploader.array('images', 15), async (req, res) => {
  try {
    const id = req.params.id;
    const { brand, product_type, description, tilestype, model_name, series } = req.body;
    const files = req.files || [];
    const { data: existing } = await xata.get(`/tables/${TABLE}/data/${id}`);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    let images = existing.images || [];
    if (files.length > 0) {
      images = await Promise.all(
        files.map(f =>
          uploadToSpaces(
            f.buffer,
            f.originalname,
            f.mimetype,
            `products/${(brand || existing.brand)}/${(product_type || existing.product_type).replace(/\s+/g, '_')}`
          ).then(({ Location }) => Location)
        )
      );
    }

    const updates = {};
    if (brand !== undefined) updates.brand = brand;
    if (product_type !== undefined) updates.product_type = product_type;
    if (description !== undefined) updates.description = description;
    if (model_name !== undefined) updates.model_name = model_name;
    if (series !== undefined) updates.series = series;
    if ((product_type || existing.product_type || '').toLowerCase() === 'tiles') {
      if (tilestype !== undefined) updates.tilestype = tilestype;
    } else {
      updates.tilestype = null;
    }
    if (files.length > 0) updates.images = images;

    const { data } = await xata.patch(`/tables/${TABLE}/data/${id}`, updates);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await xata.delete(`/tables/${TABLE}/data/${req.params.id}`);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});

router.get('/tilestypes', async (req, res) => {
  try {
    const { data } = await xata.post(`/tables/${TABLE}/query`, {});
    const records = data.records || [];
    const tileTypes = [...new Set(records.map(item => item.tilestype).filter(Boolean))];
    res.status(200).json(tileTypes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tile types', details: err.message });
  }
});

router.get('/series', async (req, res) => {
  try {
    const { brand } = req.query;
    const body = brand ? { filter: { brand } } : {};
    const { data } = await xata.post(`/tables/${TABLE}/query`, body);
    const records = data.records || [];
    const seriesList = [...new Set(records.map(item => item.series).filter(Boolean))];
    res.status(200).json(seriesList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch series', details: err.message });
  }
});

module.exports = router;
