import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
  });
});

export default app;
