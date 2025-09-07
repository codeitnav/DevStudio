const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
const { setupWSConnection } = require("y-websocket");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const config = require("./config/env");
const errorHandler = require("./api/middleware/errorHandler");
const setupSocketHandlers = require("./realtime/socketHandlers.js");

const app = express();
const server = http.createServer(app);

connectDB();

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(limiter);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  const roomManager = require("./services/roomService.js");
  const collaborationStats = roomManager.getRoomStats();

  res.status(200).json({
    success: true,
    message: "DevStudio Backend is running",
    timestamp: new Date().toISOString(),
    collaboration: {
      activeRooms: Object.keys(collaborationStats).length,
      yjsEnabled: true,
      socketIOEnabled: true,
    },
  });
});

// Routes
app.use("/api/admin", require("./api/routes/adminRoutes"));
app.use("/api/auth", require("./api/routes/authRoutes"));
app.use("/api/room", require("./api/routes/roomRoutes"));
app.use("/api/projects", require("./api/routes/fileSystemRoutes"));

// Protected routes
const { protect } = require("./api/middleware/authMiddleware");

app.get("/api/dashboard", protect, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to your dashboard!",
    user: req.user,
  });
});

app.get("/api/projects", protect, (req, res) => {
  res.json({
    success: true,
    message: "Your projects",
    user: req.user,
  });
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Setup Socket.IO event handlers
setupSocketHandlers(io);

// Initialize Yjs WebSocket Server (for CRDT document synchronization)
const roomService = require("./services/roomService");

const wss = new WebSocket.Server({
  server,
  path: "/yjs",
});

wss.on("connection", (ws, req) => {
  const urlParts = url.parse(req.url, true);
  const roomId = urlParts.query.room;

  if (!roomId) {
    console.log("❌ WebSocket connection rejected: No room ID provided");
    ws.close(1008, "Room ID required");
    return;
  }

  console.log(`🔗 Yjs client connected to room: ${roomId}`);

  // Initialize or get existing room document
  roomService.initializeYjsDocument(roomId);

  // Generate client ID
  const clientId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Add client to room's active collaborators
  roomService.addActiveCollaborator(roomId, clientId);

  // Setup Yjs WebSocket connection
  setupWSConnection(ws, req, {
    docName: roomId,
    gc: true, // Enable garbage collection
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log(`🔌 Yjs client disconnected from room: ${roomId}`);
    roomService.removeActiveCollaborator(roomId, clientId);
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error in room ${roomId}:`, error);
    roomService.removeActiveCollaborator(roomId, clientId);
  });
});

wss.on("listening", () => {
  console.log("🚀 Yjs WebSocket server ready for CRDT collaboration");
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


const PORT = config.PORT;

server.listen(PORT, () => {
  console.log(`🎯 DevStudio Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Yjs WebSocket server ready on ws://localhost:${PORT}/yjs`);
  console.log(`🔗 Socket.IO server ready on ws://localhost:${PORT}/socket.io`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Add to your existing server.js
const { startCleanupScheduler } = require("./services/cleanupService");

// Start cleanup scheduler after database connection
connectDB().then(() => {
  // Start Redis blacklist cleanup (runs every hour)
  startCleanupScheduler(60);
});

module.exports = app;
