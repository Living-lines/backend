const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.XATA_DATABASE_URL;
const API_KEY = process.env.XATA_API_KEY;

const xataRequest = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
});

module.exports = xataRequest;
