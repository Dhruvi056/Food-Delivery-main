import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;
        if (!token) return next(new Error("Authentication error"));

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Authentication error"));
            socket.decoded = decoded;
            next();
        });
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
