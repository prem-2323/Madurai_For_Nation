const express = require('express');
const upload = require('../middleware/upload');
const optionalAuth = require('../middleware/optionalAuth');
const { analyzePollution } = require('../controllers/analyzeController');
const { errorResponse } = require('../utils/response');

const router = express.Router();

router.post('/', optionalAuth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return errorResponse(res, err.message, 400);
    next();
  });
}, analyzePollution);

module.exports = router;
