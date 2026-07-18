import { Response } from "express";
import userService from "../services/userService";
import { AuthRequest } from "../middleware/authMiddleware";

class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const result = await userService.getProfile(req.userId!);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        message: error.message,
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { email, username } = req.body;

      const result = await userService.updateProfile(req.userId!, {
        email,
        username,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async deleteProfile(req: AuthRequest, res: Response) {
    try {
      const result = await userService.deleteProfile(req.userId!);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(404).json({
        message: error.message,
      });
    }
  }
}

export default new UserController();
