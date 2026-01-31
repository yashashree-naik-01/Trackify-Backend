const express = require('express');
const router = express.Router();
const { sendCustomEmail } = require('../controllers/emailController');

router.post('/send-email', sendCustomEmail);

module.exports = router;
