require("dotenv").config();

const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/devstudio",
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
};

const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} environment variable is not set`);
  }
});

module.exports = config;
