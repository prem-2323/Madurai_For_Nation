const router = require('express').Router();
const { getGeminiUsage } = require('../controllers/usageController');

router.get('/gemini', getGeminiUsage);

module.exports = router;
