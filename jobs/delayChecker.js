const Ticket = require('../models/Ticket');
const emailService = require('../services/emailService');

const checkAndNotifyDelays = async () => {
    console.log('Running delay check job...');
    try {
        const now = new Date();

        // Find tickets that:
        // 1. Are NOT 'Delivered' (or Delivered/Repaired depending on logic, sticking to active repairs)
        // 2. Are NOT 'Dispatched' (Assuming Dispatched means it's done and on way)
        // 3. Estimated completion date has passed
        // 4. Notifications are enabled
        // 5. Notification hasn't been sent yet
        const delayedTickets = await Ticket.find({
            status: { $nin: ['Delivered', 'Dispatched'] },
            estimatedCompletion: { $lt: now },
            delayNotificationsEnabled: true,
            delayNotificationSent: false
        });

        if (delayedTickets.length === 0) {
            console.log('No new delayed tickets found.');
            return;
        }

        console.log(`Found ${delayedTickets.length} delayed tickets. Sending notifications...`);

        for (const ticket of delayedTickets) {
            const emailSent = await emailService.sendDelayNotification(
                ticket.customerEmail,
                ticket.customerName,
                ticket.ticketId,
                ticket.deviceModel
            );

            if (emailSent) {
                ticket.delayNotificationSent = true;
                await ticket.save();
                console.log(`Marked ticket ${ticket.ticketId} as notified.`);
            }
        }

    } catch (error) {
        console.error('Error in delay check job:', error);
    }
};

module.exports = checkAndNotifyDelays;
