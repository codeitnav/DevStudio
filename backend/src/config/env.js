require("dotenv").config();

const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/devstudio",
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Guest session configuration
  GUEST_SESSION_DURATION: parseInt(process.env.GUEST_SESSION_DURATION) || 180, // minutes
  GUEST_SESSION_IDLE_TIMEOUT: parseInt(process.env.GUEST_SESSION_IDLE_TIMEOUT) || 30, // minutes
  GUEST_SESSION_MAX_DURATION: parseInt(process.env.GUEST_SESSION_MAX_DURATION) || 480 // 8 hours max
};

const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} environment variable is not set`);
  }
});

module.exports = config;
