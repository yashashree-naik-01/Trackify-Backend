const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true, index: true }, // Public ID (e.g., TRK-123456)
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    deviceModel: { type: String, required: true },
    issueDescription: { type: String, required: true },
    status: {
        type: String,
        enum: ['Created', 'Picked Up', 'Received', 'In Repair', 'Repaired', 'Dispatched', 'Delivered'],
        default: 'Created',
        index: true // Frequent filtering by status
    },
    qrCode: { type: String }, // Base64 Data URL
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // StatusHistory will be queried separately or virtually populated, 
    // but keeping a latest status timestamp here can be useful for sorting.
    lastUpdated: { type: Date, default: Date.now },
    estimatedCompletion: { type: Date },
    originalEstimatedCompletion: { type: Date }, // Original estimate from creation, never changes
    delayNotificationsEnabled: { type: Boolean, default: true },
    delayNotificationSent: { type: Boolean, default: false },
    assignedServiceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' }
}, { timestamps: true });

// Index for getting a user's tickets (Vendor)
ticketSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
