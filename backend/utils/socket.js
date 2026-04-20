import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Customer joins their personal room (keyed by userId)
        socket.on("join_user", (userId) => {
            socket.join(`user_${userId}`);
            console.log(`👤 User ${userId} joined room user_${userId}`);
        });

        // Admin joins the admin room
        socket.on("join_admin", () => {
            socket.join("admin_room");
            console.log(`🛡️  Admin joined admin_room (${socket.id})`);
        });

        // Rider joins the shared rider broadcast room + personal room
        socket.on("join_rider", (riderId) => {
            socket.join("rider_room");
            socket.join(`rider_${riderId}`);
            console.log(`🛵 Rider ${riderId} joined rider_room`);
        });

        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    console.log("⚡ Socket.io initialized");
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initSocket first.");
    }
    return io;
};
