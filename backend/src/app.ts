import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import goalRoutes from "./routes/goalRoutes";
import weightLogRoutes from "./routes/weightLogRoutes";
import foodRoutes from "./routes/foodRoutes";
import diaryRoutes from "./routes/diaryRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import exerciseRoutes from "./routes/exerciseRoutes";
import workoutRoutes from "./routes/workoutRoutes";

const app = express();

// Security headers & response trimming
app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  next();
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/goals", goalRoutes);
app.use("/weight-logs", weightLogRoutes);
app.use("/foods", foodRoutes);
app.use("/diaries", diaryRoutes);
app.use("/uploads", uploadRoutes);
app.use("/exercises", exerciseRoutes);
app.use("/workouts", workoutRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
  });
});

export default app;
