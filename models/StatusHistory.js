const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    status: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    image: { type: String }, // Base64 string for image
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional (system updates vs user updates)
    timestamp: { type: Date, default: Date.now }
});

// Compound index if we often query history for a specific ticket sorted by time
statusHistorySchema.index({ ticket: 1, timestamp: -1 });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
