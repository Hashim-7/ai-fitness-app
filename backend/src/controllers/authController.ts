import { Request, Response } from "express";
import authService from "../services/authService";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      res.cookie("token", result.token, getCookieOptions());

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      res.cookie("token", result.token, getCookieOptions());

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({
        message: error.message,
      });
    }
  }

  async logout(_req: Request, res: Response) {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  }
}

export default new AuthController();
