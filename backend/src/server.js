const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const config = require("./config/env");
const errorHandler = require("./api/middleware/errorHandler");

const app = express();

// Connect to MongoDB
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
  res.status(200).json({
    success: true,
    message: "DevStudio Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", require("./api/routes/authRoutes"));
// app.use('/api/rooms', require('./api/routes/roomRoutes'));
// app.use('/api/users', require('./api/routes/userRoutes'));

// Protected route examples
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

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  console.log(`DevStudio Backend running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
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
