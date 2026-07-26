import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

console.log("URI loaded:", process.env.MONGODB_URI ? "yes" : "NO - undefined");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route - confirms the server is alive
app.get("/", (req, res) => {
  res.send("Fabulis API is running");
});

// Routes
app.use("/api/auth", authRoutes);

// Connect to MongoDB, then start the server only once connected
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });