import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userRepository from "../repositories/userRepository";

class AuthService {
  async register(data: { email: string; username?: string; password: string }) {
    const existingEmail = await userRepository.findByEmail(data.email);

    if (existingEmail) {
      throw new Error("Email already in use");
    }

    if (data.username) {
      const existingUsername = await userRepository.findByUsername(
        data.username,
      );

      if (existingUsername) {
        throw new Error("Username already in use");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.createUser({
      email: data.email,
      username: data.username,
      password: hashedPassword,
    });

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await userRepository.findByEmail(data.email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  private generateToken(userId: string) {
    return jwt.sign(
      {
        userId,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );
  }
}

export default new AuthService();
