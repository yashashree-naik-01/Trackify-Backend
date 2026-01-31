const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const StatusHistory = require('./models/StatusHistory');
require('dotenv').config();

// Test delay detection with the new logic

const STAGE_DURATIONS = {
    'Created': 1,
    'Picked Up': 1,
    'Received': 1,
    'In Repair': 3,
    'Repaired': 1,
    'Dispatched': 2,
    'Delivered': 0
};

const augmentTicketWithDelay = (ticket) => {
    if (!ticket) return null;
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;

    if (ticketObj.status === 'Delivered') {
        ticketObj.isDelayed = false;
    } else {
        // Calculate when the current stage SHOULD have been reached
        const currentStageIndex = Object.keys(STAGE_DURATIONS).indexOf(ticketObj.status);

        if (currentStageIndex >= 0) {
            // Sum up durations of all stages BEFORE the current stage
            const stageKeys = Object.keys(STAGE_DURATIONS);
            let daysToCurrent = 0;
            for (let i = 0; i < currentStageIndex; i++) {
                daysToCurrent += STAGE_DURATIONS[stageKeys[i]];
            }

            // Calculate when current stage should have been reached
            const expectedStageTime = new Date(ticketObj.createdAt);
            expectedStageTime.setDate(expectedStageTime.getDate() + daysToCurrent);

            // If we're past when this stage should have been reached, it's delayed
            ticketObj.isDelayed = new Date() > expectedStageTime;

            return { ticketObj, expectedStageTime, currentTime: new Date(), daysToCurrent };
        }
    }
    return { ticketObj, expectedStageTime: null, currentTime: new Date(), daysToCurrent: 0 };
};

const testDelay = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Get the most recent Picked Up ticket
        const ticket = await Ticket.findOne({ status: 'Picked Up' }).sort({ createdAt: -1 });

        if (!ticket) {
            console.log('No Picked Up tickets found');
            process.exit(0);
        }

        console.log('=== Testing Delay Detection ===\n');
        console.log(`Ticket ID: ${ticket.ticketId}`);
        console.log(`Status: ${ticket.status}`);
        console.log(`Created At: ${ticket.createdAt}`);

        const result = augmentTicketWithDelay(ticket);

        console.log(`\nDays until "${result.ticketObj.status}" should be reached: ${result.daysToCurrent}`);
        console.log(`Expected "${result.ticketObj.status}" by: ${result.expectedStageTime}`);
        console.log(`Current Time: ${result.currentTime}`);
        console.log(`\n** IS DELAYED: ${result.ticketObj.isDelayed} **\n`);

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testDelay();
