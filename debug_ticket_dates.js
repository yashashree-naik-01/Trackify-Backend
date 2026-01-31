const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
require('dotenv').config();

// Debug script to check ticket dates

const debugTicket = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get the most recent ticket with "Picked Up" status
        const tickets = await Ticket.find({ status: 'Picked Up' })
            .sort({ createdAt: -1 })
            .limit(5);

        const fs = require('fs');
        let output = '=== Recent Picked Up Tickets ===\n\n';

        for (const ticket of tickets) {
            output += `Ticket ID: ${ticket.ticketId}\n`;
            output += `Status: ${ticket.status}\n`;
            output += `Created At: ${ticket.createdAt}\n`;
            output += `Estimated Completion: ${ticket.estimatedCompletion}\n`;
            output += `Original Estimated Completion: ${ticket.originalEstimatedCompletion}\n`;
            output += `Current Date: ${new Date()}\n`;

            const isDelayed = ticket.originalEstimatedCompletion
                ? new Date() > new Date(ticket.originalEstimatedCompletion)
                : false;
            output += `Should be delayed: ${isDelayed}\n`;
            output += '---\n\n';
        }

        fs.writeFileSync('debug_output.txt', output);
        console.log(output);
        console.log('Output written to debug_output.txt');

        process.exit(0);
    } catch (error) {
        console.error('Debug error:', error);
        process.exit(1);
    }
};

debugTicket();
