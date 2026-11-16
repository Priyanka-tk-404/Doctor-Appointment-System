const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const DOCS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const makeUpload = (subdir, allowed = DOCS) => {
  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(Object.assign(new Error('Unsupported file type.'), { status: 400 })),
  });
};

module.exports = { makeUpload, UPLOAD_ROOT };
