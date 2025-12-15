const express = require('express');
const multer = require('multer');
const { uploadToR2, isConfigured: r2Configured } = require('../lib/r2');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

const router = express.Router();

// Configure multer with file size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
  },
});

/**
 * POST /api/uploads/image
 * Upload an image file to R2 bucket.
 */
router.post('/image', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!r2Configured) {
      return res.status(500).json({ error: 'R2 storage is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.' });
    }

    const result = await uploadToR2(req.file.buffer, req.file.mimetype, 'images');
    return res.status(201).json({
      url: result.url,
      key: result.key,
      storage: 'r2',
    });
  } catch (err) {
    console.error('Image upload route error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/uploads/video
 * Upload a video file to R2 bucket.
 */
router.post('/video', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!r2Configured) {
      return res.status(500).json({ error: 'R2 storage is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.' });
    }

    const result = await uploadToR2(req.file.buffer, req.file.mimetype, 'videos');
    return res.status(201).json({
      url: result.url,
      key: result.key,
      storage: 'r2',
    });
  } catch (err) {
    console.error('Video upload route error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/uploads/storage-info
 * Get info about configured storage provider
 */
router.get('/storage-info', protect, isAdmin, (req, res) => {
  res.json({
    r2Configured,
    preferredStorage: 'r2',
  });
});

module.exports = router;
