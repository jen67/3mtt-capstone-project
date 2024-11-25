const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables
const app = express();

// Enable CORS for cross-origin requests
app.use(cors());

// Body parser middleware to handle JSON requests
app.use(express.json());

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, "frontend")));

// Set up environment variables from .env file
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/taskmaster";

// MongoDB connection with error handling
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error: ", err));

// Import models
const User = require("./models/User");
const Task = require("./models/Task");

// API routes for user and task management
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

// Route to serve index.html at the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Route to serve login.html specifically
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
