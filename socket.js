const socketIo = require('socket.io');

let io;

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all for demo
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[SOCKET] User connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[SOCKET] User disconnected: ${socket.id}`);
        });

        // Join rooms based on role or specific IDs if needed
        socket.on('join', (room) => {
            socket.join(room);
            console.log(`[SOCKET] User ${socket.id} joined room: ${room}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { init, getIO };
