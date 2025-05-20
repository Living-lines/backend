require('dotenv').config();

const multer = require('multer');
const AWS    = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path  = require('path');

// existing single‐file uploaders left untouched
const imageStorage = multer.memoryStorage();
const imageUpload  = multer({
  storage: imageStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single('image');

const pdfStorage = multer.memoryStorage();
const pdfUpload  = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single('file');    // ← still accepts `file` for backwards‐compatibility

// NEW: accept BOTH file (PDF) and image in one upload:
const catalogUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.fieldname === 'file' &&
      file.mimetype === 'application/pdf'
    ) {
      return cb(null, true);
    }
    if (
      file.fieldname === 'image' &&
      (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
    ) {
      return cb(null, true);
    }
    return cb(
      new Error(
        `Invalid file type for '${file.fieldname}'. ` +
        `Use field 'file' for PDFs and 'image' for JPEG/PNG.`
      )
    );
  }
}).fields([
  { name: 'file',  maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

// DigitalOcean Spaces client (unchanged)
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

// upload helper (unchanged)
async function uploadToSpaces(buffer, originalName, mimetype, folder) {
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${uuidv4()}${ext}`;
  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read',
  };
  const data = await s3.upload(params).promise();
  return data; // data.Location has the URL
}

module.exports = {
  imageUpload,
  pdfUpload,
  catalogUpload,
  uploadToSpaces,
};
