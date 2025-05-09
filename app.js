// app.js
require('dotenv').config();              // ← load .env first

const express      = require('express');
const path         = require('path');
const logger       = require('morgan');
const cookieParser = require('cookie-parser');

// import your routers
const productsRouter = require('./routes/products');
const quotesRouter   = require('./routes/quotes');
const catalogsRouter = require('./routes/catalogs');

const app = express();

// standard middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// mount each API under /api/*
app.use('/api/products', productsRouter);
app.use('/api/quotes',   quotesRouter);
app.use('/api/catalogs', catalogsRouter);

// catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
