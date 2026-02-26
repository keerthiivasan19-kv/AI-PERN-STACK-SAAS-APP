import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url) }); // MUST be the very first thing

// 🔍 DEBUG (temporary but safe)
console.log("OPENAI:", process.env.OPENAI_API_KEY ? "LOADED" : "MISSING");
console.log("GEMINI:", process.env.GEMINI_API_KEY ? "LOADED" : "MISSING");
console.log("CLERK:", process.env.CLERK_SECRET_KEY ? "LOADED" : "MISSING");
console.log("CLOUDINARY:", process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING");

import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";

// ROUTES
import aiRouter from "./routes/aiRoutes.js";
import userRouter from "./routes/userRouts.js";

const app = express();

// 🔴 REQUIRED for req.auth() to work
app.use(clerkMiddleware());

// Initialize Cloudinary
connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("AI SaaS Backend is running 🚀");
});

// API routes
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
