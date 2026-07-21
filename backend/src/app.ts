import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import goalRoutes from "./routes/goalRoutes";
import weightLogRoutes from "./routes/weightLogRoutes";
import foodRoutes from "./routes/foodRoutes";
import diaryRoutes from "./routes/diaryRoutes";

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

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
  });
});

export default app;
