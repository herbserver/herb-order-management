const socketIo = require('socket.io');

let io;

function normalizeEmployeeRoomId(rawEmployeeId) {
    return String(rawEmployeeId || '').trim().toUpperCase();
}

module.exports = {
    init: (httpServer, allowedOrigins) => {
        io = socketIo(httpServer, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('New Client Connected:', socket.id);

            socket.on('join-employee-room', (payload = {}) => {
                const employeeId = normalizeEmployeeRoomId(
                    typeof payload === 'string' ? payload : payload.employeeId
                );

                if (!employeeId) return;
                const roomName = `employee:${employeeId}`;
                socket.join(roomName);
                console.log(`Employee room joined: ${roomName} (${socket.id})`);
            });

            socket.on('disconnect', () => {
                console.log('Client Disconnected:', socket.id);
            });

            socket.join('all');
        });

        setInterval(() => {
            io.emit('server-heartbeat', { timestamp: Date.now() });
        }, 30000);

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
