require('dotenv').config();

const multer  = require('multer');
const AWS     = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path    = require('path');

/* ──────────────────────────────
   1.  Generic in-memory uploader
   ────────────────────────────── */
const uploader = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 }      // 50 MB cap
});

/* ──────────────────────────────
   2.  Special-case middlewares
   ────────────────────────────── */
// PDF-only (old route, unchanged)
const pdfUpload = uploader.single('file');

// Catalog route: one PDF + one preview image
const catalogUpload = uploader.fields([
  { name: 'file',  maxCount: 1 },               // PDF
  { name: 'image', maxCount: 1 }                // JPEG/PNG
]);

/* ──────────────────────────────
   3.  DigitalOcean Spaces helper
   ────────────────────────────── */
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);

const s3 = new AWS.S3({
  endpoint:        spacesEndpoint,
  accessKeyId:     process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

async function uploadToSpaces(buffer, originalName, mime, folder) {
  const safeName = originalName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, ''); // safety

  const key = `${folder}/${Date.now()}_${safeName}`;

  const { Location } = await s3.upload({
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mime,
    ACL: 'public-read'
  }).promise();

  return { Location };
}


/* ──────────────────────────────
   4.  Exports
   ────────────────────────────── */
module.exports = {
  uploader,        // <-- generic Multer instance
  pdfUpload,
  catalogUpload,
  uploadToSpaces
};
