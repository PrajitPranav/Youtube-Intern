import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import paymentroutes from "./routes/payment.js";

dotenv.config();

// Ensure uploads directory exists (Render ephemeral FS needs this)
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// CORS — allow all origins in production for Render/Vercel compatibility
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow: no origin (server-to-server, curl), localhost, Vercel, Render
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("vercel.app") ||
        origin.includes("onrender.com") ||
        origin === process.env.FRONTEND_URL
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for now — tighten after launch
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use("/uploads", express.static(uploadsDir));

// Health check
app.get("/", (req, res) => {
  res.send("YouTube backend is working");
});

// Routes
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/payment", paymentroutes);

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;

const connectDB = async () => {
  if (!DBURL) {
    console.warn("DB_URL is not configured. MongoDB connection skipped.");
    return;
  }
  try {
    await mongoose.connect(DBURL);
    console.log("Mongodb connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error?.message || error);
  }
};

connectDB();
