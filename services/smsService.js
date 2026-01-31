const axios = require('axios');

const sendOtpSms = async (phoneNumber, otp) => {
    if (!process.env.FAST2SMS_API_KEY) {
        console.warn('⚠️ FAST2SMS_API_KEY is missing. SMS will NOT be sent.');
        console.log(`[Mock SMS] To: ${phoneNumber}, OTP: ${otp}`);
        return false;
    }

    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            route: 'otp',
            variables_values: otp,
            numbers: phoneNumber,
        }, {
            headers: {
                "authorization": process.env.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ SMS Sent to ${phoneNumber}:`, response.data);
        return true;
    } catch (error) {
        console.error('❌ SMS Failed:', error.response?.data || error.message);
        return false;
    }
};

module.exports = { sendOtpSms };
