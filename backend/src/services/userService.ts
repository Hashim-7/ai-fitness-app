import userRepository from "../repositories/userRepository";

class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findProfileById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      email?: string;
      username?: string;
    },
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }

      const existingEmail = await userRepository.findByEmail(data.email);

      if (existingEmail && existingEmail.id !== userId) {
        throw new Error("Email already in use");
      }
    }

    if (data.username) {
      const existingUsername = await userRepository.findByUsername(
        data.username,
      );

      if (existingUsername && existingUsername.id !== userId) {
        throw new Error("Username already in use");
      }
    }

    return userRepository.updateUser(userId, {
      email: data.email,
      username: data.username,
    });
  }

  async deleteProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    await userRepository.deleteUser(userId);

    return {
      message: "Account deleted successfully",
    };
  }
}

export default new UserService();
