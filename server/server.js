import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

dotenv.config();

console.log("URI loaded:", process.env.MONGODB_URI ? "yes" : "NO - undefined");

// package.json sets "type": "module", so __dirname doesn't exist here and
// has to be derived from the module URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
// Widen img-src so TMDB/AniList posters aren't blocked by helmet's default CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://image.tmdb.org", "https://s4.anilist.co"],
      },
    },
  })
);
// Opt-in origin restriction - if CLIENT_ORIGIN isn't set, this falls back
// to the exact same wide-open behavior as before (cors() with no options).
app.use(cors(process.env.CLIENT_ORIGIN ? { origin: process.env.CLIENT_ORIGIN } : undefined));
app.use(express.json());

// Health check endpoint for load balancers and uptime monitoring
app.get("/api/health", (req, res) => {
  res.send("Fabulis API is running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommend", aiRoutes);
app.use("/api", mediaRoutes);
app.use(express.static(path.join(__dirname, "..", "client")));

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