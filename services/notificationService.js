const EventEmitter = require('events');

class NotificationService extends EventEmitter {
    constructor() {
        super();
        this.on('statusChange', this.handleStatusChange);
    }

    async handleStatusChange({ ticket, status }) {
        // Define Key Statuses that trigger notifications
        const KEY_STATUSES = ['Created', 'Repaired', 'Dispatched', 'Delivered'];

        if (!KEY_STATUSES.includes(status)) {
            // console.log(`[Notification] Skipping minor update: ${status}`);
            return;
        }

        console.log(`\n--- [NOTIFICATION EVENT] ---`);
        console.log(`Event: Ticket ${ticket.ticketId} updated to ${status}`);

        // Simulate sending parallel notifications
        await Promise.all([
            this.sendEmail(ticket, status),
            this.sendWhatsApp(ticket, status)
        ]);
        console.log(`----------------------------\n`);
    }

    async sendEmail(ticket, status) {
        // Mock Email Logic
        console.log(`📧 Sending EMAIL to ${ticket.customerName} (${ticket.email || 'no-email'}):`);
        console.log(`   "Subject: Update on Device ${ticket.deviceModel}"`);
        console.log(`   "Body: Your device status is now: ${status}. Track at http://localhost:5173/track/${ticket.ticketId}"`);
        return true;
    }

    async sendWhatsApp(ticket, status) {
        // Mock WhatsApp Logic
        console.log(`📱 Sending WHATSAPP to ${ticket.customerPhone}:`);
        console.log(`   "Message: Hi ${ticket.customerName}, your device (${ticket.deviceModel}) is now ${status}. Track here: http://localhost:5173/track/${ticket.ticketId}"`);
        return true;
    }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
