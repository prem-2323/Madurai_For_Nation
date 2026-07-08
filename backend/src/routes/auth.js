const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.get('/profile323', protect, getMe);

module.exports = router;
