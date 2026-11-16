const router = require('express').Router();
const fs = require('fs');
const { auth, requireRole } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const settings = require('../utils/settings');

const logoUpload = makeUpload('branding', ['image/png', 'image/jpeg', 'image/webp']).single('logo');

// Public: branding + commission are needed before login (landing page, fee preview)
router.get('/public', asyncHandler(async (req, res) => res.json(await settings.getAll())));

router.put('/', auth, requireRole('admin'), logoUpload, asyncHandler(async (req, res) => {
  const { appName, commissionPercent } = req.body;
  try {
    if (commissionPercent !== undefined && commissionPercent !== '') {
      const c = Number(commissionPercent);
      if (isNaN(c) || c < 0 || c > 90) throw httpError(400, 'Commission must be between 0 and 90 percent.');
      await settings.set('commissionPercent', c);
    }
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    throw e;
  }
  if (appName && appName.trim()) await settings.set('appName', appName.trim().slice(0, 60));
  if (req.file) await settings.set('logoPath', `/uploads/branding/${req.file.filename}`);
  res.json(await settings.getAll());
}));

module.exports = router;
