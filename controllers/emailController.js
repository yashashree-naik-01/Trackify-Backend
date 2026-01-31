const emailService = require('../services/emailService');

// @desc    Send custom email
// @route   POST /api/send-email
// @access  Public
const sendCustomEmail = async (req, res) => {
    const { email, message } = req.body;

    // Validate inputs
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    // Email format validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Message length validation (max 1000 characters)
    if (message.length > 1000) {
        return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
    }

    if (message.trim().length === 0) {
        return res.status(400).json({ message: 'Message cannot be empty' });
    }

    try {
        const success = await emailService.sendCustomEmail(email, message);

        if (success) {
            res.json({ message: 'Email sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send email. Please try again later.' });
        }
    } catch (error) {
        console.error('Send Email Error:', error);
        res.status(500).json({ message: 'An error occurred while sending the email' });
    }
};

module.exports = { sendCustomEmail };
