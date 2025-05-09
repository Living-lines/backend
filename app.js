const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const productsRouter = require('./routes/products');
const quotesRouter = require('./routes/quotes');
const catalogRouter = require('./routes/catalogs');



const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/catalogs', catalogRouter);

// Default 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
