import rateLimit from "express-rate-limit";

export const authLimiter =
  process.env.NODE_ENV === "test"
    ? (_req: any, _res: any, next: any) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: {
          message: "Too many attempts, please try again later",
        },
      });
