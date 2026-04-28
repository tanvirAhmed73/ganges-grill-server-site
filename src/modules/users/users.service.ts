import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type UserApiResponse = {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserApiResponse[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.toApiResponse(user));
  }

  async removeById(id: string): Promise<UserApiResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: 'user not found' });
    }

    const removed = await this.prisma.user.delete({
      where: { id: existing.id },
    });
    return this.toApiResponse(removed);
  }

  async promoteToAdmin(id: string): Promise<UserApiResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: 'user not found' });
    }

    const updated = await this.prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin' },
    });
    return this.toApiResponse(updated);
  }

  private toApiResponse(user: User): UserApiResponse {
    return {
      _id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
