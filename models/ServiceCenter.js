const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema({
    centerName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    city: { type: String, required: true, trim: true },
    servicesOffered: [{ type: String }],
    verified: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Link to auth user
}, { timestamps: true });

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);
