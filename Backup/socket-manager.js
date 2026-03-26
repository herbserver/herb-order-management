const socketIo = require('socket.io');

let io;

module.exports = {
    init: (httpServer, allowedOrigins) => {
        io = socketIo(httpServer, {
            cors: {
                origin: allowedOrigins, // Re-use the origins from server.js
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('🔌 New Client Connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('🔌 Client Disconnected:', socket.id);
            });

            // Can add room logic here if needed (e.g., specific rooms for admins)
            socket.join('all'); // Join a global room for now
        });

        // Start Heartbeat
        setInterval(() => {
            io.emit('server-heartbeat', { timestamp: Date.now() });
        }, 30000); // 30 seconds

        return io;

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
