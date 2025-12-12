import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config/index.js";
import notificationRoutes from "./routes/notification.routes.js";
import { setupEventListeners } from "./lib/eventListeners.js";

const app = express();
const httpServer = createServer(app);

// Create Redis clients for Socket.IO adapter
const pubClient = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD!,
  socket: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);
console.log("✅ Redis connected");

// Socket.IO setup with Redis adapter
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  },
  adapter: createAdapter(pubClient, subClient),
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join user to their personal room (using userId)
  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "notification-service" });
});

// Routes
app.use("/api/notifications", notificationRoutes);

// Start server and set up event listeners
httpServer.listen(config.port, async () => {
  console.log(`🚀 Notification Service running on port ${config.port}`);
  await setupEventListeners(io);
});
