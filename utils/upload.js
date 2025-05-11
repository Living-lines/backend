/*// /utils/upload.js
require('dotenv').config();

const multer = require('multer');
const AWS    = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path  = require('path');

// 1) Multer config
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
}).single('image');                      // field name = 'image'

// 2) Spaces client
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

// 3) Upload fn
async function uploadToSpaces(buffer, originalName, mimetype, brand) {
  // validate type
  if (!['image/jpeg','image/png'].includes(mimetype)) {
    throw new Error('Only JPEG/PNG allowed');
  }

  const ext = path.extname(originalName);
  // prefix with brand folder
  const key = `${brand}/${uuidv4()}${ext}`;

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read'
  };

  const data = await s3.upload(params).promise();
  return data; // .Location contains the public URL
}

module.exports = { upload, uploadToSpaces };


*/

// D:\backend\utils\upload.js
require('dotenv').config();

const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// 1. Multer setup: expects a field named "file"
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single('file'); // ✅ FIXED: This must match the frontend field name

// 2. DigitalOcean Spaces client
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

// 3. Upload function
async function uploadToSpaces(buffer, originalName, mimetype, folder) {
  if (!['application/pdf'].includes(mimetype)) {
    throw new Error('Only PDF files are allowed');
  }

  const ext = path.extname(originalName);
  const key = `${folder}/${uuidv4()}${ext}`;

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read',
  };

  const data = await s3.upload(params).promise();
  return data; // .Location is the public URL
}

module.exports = { upload, uploadToSpaces };
