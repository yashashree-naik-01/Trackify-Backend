const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
require('dotenv').config();

// Migration script to add originalEstimatedCompletion to existing tickets

const migrateTickets = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all tickets that don't have originalEstimatedCompletion set
        const tickets = await Ticket.find({
            originalEstimatedCompletion: { $exists: false }
        });

        console.log(`Found ${tickets.length} tickets to migrate`);

        let migrated = 0;
        for (const ticket of tickets) {
            // Use existing estimatedCompletion as the original
            let originalEstimate;
            if (ticket.estimatedCompletion) {
                originalEstimate = ticket.estimatedCompletion;
            } else {
                // Calculate based on createdAt + total days (9 days total)
                const totalDays = 9; // 1+1+1+3+1+2 = 9 days
                originalEstimate = new Date(ticket.createdAt);
                originalEstimate.setDate(originalEstimate.getDate() + totalDays);
            }

            // Use direct update to avoid validation issues
            await Ticket.updateOne(
                { _id: ticket._id },
                {
                    $set: {
                        originalEstimatedCompletion: originalEstimate,
                        ...(ticket.estimatedCompletion ? {} : { estimatedCompletion: originalEstimate })
                    }
                }
            );
            migrated++;
            console.log(`Migrated ticket ${ticket.ticketId}`);
        }

        console.log(`Migration complete! Updated ${migrated} tickets.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrateTickets();
