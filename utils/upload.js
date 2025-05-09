const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Multer setup for parsing multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('file'); // This is the key change to fix the error

// DigitalOcean Spaces config
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT); // Use the correct endpoint
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

// Function to upload file to DigitalOcean Spaces
const uploadToSpaces = async (buffer, filename, mimetype, folder = 'uploads') => {
  // Validate file type (allow images and PDFs only)
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(mimetype)) {
    throw new Error('Invalid file type. Only images (JPEG/PNG) and PDFs are allowed.');
  }

  // Get file extension (e.g., .jpg, .pdf)
  const ext = path.extname(filename);
  const uniqueName = `${folder}/${uuidv4()}${ext}`; // Unique filename using UUID

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET, // Your bucket name
    Key: uniqueName, // File path in Space
    Body: buffer, // File data (buffered)
    ContentType: mimetype, // MIME type of the file
    ACL: 'public-read', // Make the file publicly accessible
  };

  try {
    const data = await s3.upload(params).promise();
    return data; // Returns file details including URL
  } catch (err) {
    throw new Error(`Error uploading to DigitalOcean Spaces: ${err.message}`);
  }
};

module.exports = { upload, uploadToSpaces };  // Ensure these are exported correctly
