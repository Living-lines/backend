require('dotenv').config();

const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// 1. Multer setup for image upload (only for product images)
const imageStorage = multer.memoryStorage();
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for images
}).single('image'); // field name must be 'image'

// 2. Multer setup for PDF upload (for catalog)
const pdfStorage = multer.memoryStorage();
const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for PDFs
}).single('file'); // field name must be 'pdf'

// 3. DigitalOcean Spaces client
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

// 4. Upload function to handle both PDF and image uploads
async function uploadToSpaces(buffer, originalName, mimetype, folder) {
  const ext = path.extname(originalName).toLowerCase();
  let allowedTypes;

  // Check file type (images or PDFs)
  if (mimetype.startsWith('image/')) {
    allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(mimetype)) {
      throw new Error('Only JPEG/PNG images are allowed');
    }
  } else if (mimetype === 'application/pdf') {
    allowedTypes = ['application/pdf'];
  } else {
    throw new Error('Only images (JPEG/PNG) and PDFs are allowed');
  }

  // Generate a unique file name
  const key = `${folder}/${uuidv4()}${ext}`;

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read',
  };

  const data = await s3.upload(params).promise();
  return data; // .Location contains the public URL
}

module.exports = { imageUpload, pdfUpload, uploadToSpaces };
