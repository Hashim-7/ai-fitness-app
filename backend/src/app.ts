import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import goalRoutes from "./routes/goalRoutes";
import weightLogRoutes from "./routes/weightLogRoutes";
import foodRoutes from "./routes/foodRoutes";
import diaryRoutes from "./routes/diaryRoutes";
import uploadRoutes from "./routes/uploadRoutes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/goals", goalRoutes);
app.use("/weight-logs", weightLogRoutes);
app.use("/foods", foodRoutes);
app.use("/diaries", diaryRoutes);
app.use("/uploads", uploadRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
  });
});

export default app;
