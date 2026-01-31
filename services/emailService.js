const nodemailer = require('nodemailer');

/**
 * Email Service for OTP Delivery
 * Uses Nodemailer with SMTP transport
 */

const sendOtpEmail = async (customerEmail, customerName, otp, ticketId) => {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials missing. OTP will be logged to console.');
        console.log(`[Mock Email] To: ${customerEmail}, OTP: ${otp}`);
        return false;
    }

    try {
        // Create SMTP transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // You can change to 'outlook', 'yahoo', etc.
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email content
        const mailOptions = {
            from: `"Trackify Support" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: 'Trackify – Your Repair Tracking OTP',
            text: `Hello ${customerName},

Your device repair ticket (${ticketId}) has been created successfully.

Your One-Time Password (OTP) for tracking: ${otp}

Use this OTP along with your Ticket ID to track your device repair status at:
http://localhost:5173/track/${ticketId}

Please do not share this OTP with anyone.

Best regards,
Trackify Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Trackify – Device Repair Tracking</h2>
                    <p>Hello <strong>${customerName}</strong>,</p>
                    <p>Your device repair ticket (<strong>${ticketId}</strong>) has been created successfully.</p>
                    
                    <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #6B7280;">Your One-Time Password (OTP):</p>
                        <h1 style="margin: 10px 0; color: #4F46E5; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
                    </div>

                    <p>Use this OTP along with your Ticket ID to track your device repair status.</p>
                    <p style="color: #EF4444; font-size: 14px;">⚠️ Please do not share this OTP with anyone.</p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    <p style="color: #6B7280; font-size: 12px;">Best regards,<br>Trackify Team</p>
                </div>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${customerEmail}: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

/**
 * Send custom email message
 * @param {string} recipientEmail - Email address to send to
 * @param {string} message - Custom message content
 * @returns {boolean} - Success status
 */
const sendCustomEmail = async (recipientEmail, message) => {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials missing. Email will be logged to console.');
        console.log(`[Mock Email] To: ${recipientEmail}, Message: ${message}`);
        return false;
    }

    try {
        // Create SMTP transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email content
        const mailOptions = {
            from: `"Trackify" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: 'Message from Trackify',
            text: message,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Message from Trackify</h2>
                    <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="white-space: pre-wrap; color: #374151;">${message}</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    <p style="color: #6B7280; font-size: 12px;">Best regards,<br>Trackify Team</p>
                </div>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Custom email sent to ${recipientEmail}: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

/**
 * Send delay notification email
 * @param {string} customerEmail 
 * @param {string} customerName 
 * @param {string} ticketId 
 * @param {string} deviceModel 
 * @returns {boolean}
 */
const sendDelayNotification = async (customerEmail, customerName, ticketId, deviceModel) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: `"Trackify Support" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: `Update regarding your repair (Ticket: ${ticketId})`,
            text: `Hello ${customerName},\n\nWe wanted to let you know that your repair for ${deviceModel} (Ticket: ${ticketId}) is taking a little longer than originally estimated.\n\nOur team is working to complete it as soon as possible. You can check the latest status at: http://localhost:5173/track/${ticketId}\n\nThank you for your patience.\n\nBest regards,\nTrackify Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Repair Status Update</h2>
                    <p>Hello <strong>${customerName}</strong>,</p>
                    <p>We wanted to let you know that your repair for <strong>${deviceModel}</strong> (Ticket: <strong>${ticketId}</strong>) is taking a little longer than originally estimated.</p>
                    <p>Our team is working ensure everything is done correctly. We appreciate your patience.</p>
                    
                    <div style="background-color: #FFF7ED; padding: 15px; border-left: 4px solid #F97316; margin: 20px 0;">
                        <p style="margin: 0; color: #9A3412;">check the latest status anytime:</p>
                        <p style="margin: 5px 0;"><a href="http://localhost:5173/track/${ticketId}" style="color: #EA580C; font-weight: bold;">Track Repair Status</a></p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    <p style="color: #6B7280; font-size: 12px;">Best regards,<br>Trackify Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Delay notification sent to ${customerEmail}: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Delay email failed:', error.message);
        return false;
    }
};

module.exports = { sendOtpEmail, sendCustomEmail, sendDelayNotification };
