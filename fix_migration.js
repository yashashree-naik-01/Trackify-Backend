const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
require('dotenv').config();

// Fix migration - recalculate original estimates based on createdAt

const STAGE_DURATIONS = {
    'Created': 1,
    'Picked Up': 1,
    'Received': 1,
    'In Repair': 3,
    'Repaired': 1,
    'Dispatched': 2,
    'Delivered': 0
};

const fixMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get ALL tickets
        const tickets = await Ticket.find({});

        console.log(`Found ${tickets.length} tickets to fix`);

        const totalDays = Object.keys(STAGE_DURATIONS).reduce((sum, stage) => {
            return sum + STAGE_DURATIONS[stage];
        }, 0);

        console.log(`Total duration: ${totalDays} days`);

        let fixed = 0;
        for (const ticket of tickets) {
            // Recalculate original estimate from createdAt
            const originalEstimate = new Date(ticket.createdAt);
            originalEstimate.setDate(originalEstimate.getDate() + totalDays);

            // Update both fields
            await Ticket.updateOne(
                { _id: ticket._id },
                {
                    $set: {
                        originalEstimatedCompletion: originalEstimate,
                        estimatedCompletion: originalEstimate
                    }
                }
            );
            fixed++;
            console.log(`Fixed ticket ${ticket.ticketId}: Created ${ticket.createdAt} -> Estimate ${originalEstimate}`);
        }

        console.log(`\nFixed ${fixed} tickets.`);
        process.exit(0);
    } catch (error) {
        console.error('Fix error:', error);
        process.exit(1);
    }
};

fixMigration();
