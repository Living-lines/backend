require('dotenv').config(); // Load .env first

const express = require('express');
const cors = require('cors'); // ✅ add this
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

// Import your routers
const productsRouter = require('./routes/products');
const quotesRouter = require('./routes/quotes');
const catalogsRouter = require('./routes/catalogs');
const contactRouter = require('./routes/contact');
const subscribersRouter = require('./routes/subscribers'); // Ensure this is imported

const app = express();

// Middleware to parse JSON and enable CORS
app.use(cors()); // ✅ Add this line right after app is created
app.use(express.json()); // Ensures `req.body` is parsed correctly
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));

// Mount each API under /api/*
app.use('/api/subscribers', subscribersRouter); // Correctly mount the subscribersRouter
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/catalogs', catalogsRouter);
app.use('/api/contact', contactRouter);

// Catch-all 404 for non-existent routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
