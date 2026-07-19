import prisma from "../lib/prisma";

class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: {
        username,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async createUser(data: {
    email: string;
    username?: string;
    password: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      email?: string;
      username?: string;
    },
  ) {
    return prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: {
        id,
      },
    });
  }

  async findProfileById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export default new UserRepository();
