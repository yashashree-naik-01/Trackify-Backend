const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, ref: 'Ticket' },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now } // No expiry
});

// Index for fast lookup
otpSchema.index({ ticketId: 1 });

// Hash OTP before saving
otpSchema.pre('save', async function () {
    if (!this.isModified('otp')) return;

    // Check if it's already hashed (bcrypt hashes start with $2a$ or similar)
    if (!this.otp.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.otp = await bcrypt.hash(this.otp, salt);
    }
});

// Method to verify OTP
otpSchema.methods.matchOtp = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otp);
};

module.exports = mongoose.model('OTP', otpSchema);
