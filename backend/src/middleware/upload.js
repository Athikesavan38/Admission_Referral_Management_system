'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure upload directories exist
const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
['photos', 'documents'].forEach((dir) => {
  const p = path.join(UPLOAD_ROOT, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// Storage engine — organise by type
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const isPhoto = file.fieldname === 'photo';
    cb(null, path.join(UPLOAD_ROOT, isPhoto ? 'photos' : 'documents'));
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${base}${ext}`);
  },
});

// File filter
function fileFilter(req, file, cb) {
  const isPhoto = file.fieldname === 'photo';
  const allowed = isPhoto
    ? ['.jpg', '.jpeg', '.png', '.webp']
    : ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${allowed.join(', ')}`));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 11,                  // 1 photo + up to 10 documents
  },
});

// Middleware: accept photo (single) + documents (up to 10)
const uploadReferralFiles = upload.fields([
  { name: 'photo',     maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);

// Middleware: reconstruct contactDetails from flat fields before validation
function normalizeContactDetails(req, res, next) {
  const body = req.body;
  if (!body.contactDetails) {
    body.contactDetails = {
      phone:        body['contactDetails[phone]']        || body.phone        || '',
      email:        body['contactDetails[email]']        || body.email        || '',
      parentsPhone: body['contactDetails[parentsPhone]'] || body.parentsPhone || null,
    };
  }
  delete body.phone;
  delete body.email;
  delete body.parentsPhone;
  delete body['contactDetails[phone]'];
  delete body['contactDetails[email]'];
  delete body['contactDetails[parentsPhone]'];
  next();
}

module.exports = { uploadReferralFiles, normalizeContactDetails };
