const express = require('express');
const { getPrediction } = require('../controllers/predictionController');

const router = express.Router();

router.get('/', getPrediction);

module.exports = router;