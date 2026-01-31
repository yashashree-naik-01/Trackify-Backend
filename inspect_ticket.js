const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Ticket = require('./models/Ticket');

async function inspectTicket(id) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const ticketByLogicalId = await Ticket.findOne({ ticketId: id });
        const ticketByLogicalIdWithPrefix = await Ticket.findOne({ ticketId: `TRK-${id}` });
        const ticketById = mongoose.Types.ObjectId.isValid(id) ? await Ticket.findById(id) : null;

        console.log('Ticket by ID:', id, !!ticketByLogicalId);
        if (ticketByLogicalId) console.log(JSON.stringify(ticketByLogicalId, null, 2));

        console.log('Ticket by TRK-' + id, !!ticketByLogicalIdWithPrefix);
        if (ticketByLogicalIdWithPrefix) console.log(JSON.stringify(ticketByLogicalIdWithPrefix, null, 2));

        if (ticketById) {
            console.log('Ticket by Mongo ID:', id, !!ticketById);
            console.log(JSON.stringify(ticketById, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

const targetId = process.argv[2] || '827646';
inspectTicket(targetId);
