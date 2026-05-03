import { Injectable, NotFoundException } from '@nestjs/common';
import { CartItem } from '@prisma/client';
import { JwtAccessPayload } from '../auth/interfaces/jwt-access-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';

type CartApiResponse = {
  _id: string;
  foodId: string;
  email: string;
  name: string;
  image: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email?: string): Promise<CartApiResponse[]> {
    if (!email) {
      return [];
    }

    const items = await this.prisma.cartItem.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.toApiResponse(item));
  }

  async create(data: CreateCartItemDto, actor: JwtAccessPayload): Promise<CartApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
    });
    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: data.foodId },
    });

    const item = await this.prisma.cartItem.create({
      data: {
        foodId: data.foodId,
        email: user.email,
        name: user.name,
        image: data.image,
        price: data.price,
        userId: user.id,
        menuItemId: menuItem?.id ?? null,
      },
    });

    return this.toApiResponse(item);
  }

  async remove(id: string): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const existing = await this.prisma.cartItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: 'cart item not found' });
    }

    await this.prisma.cartItem.delete({
      where: { id: existing.id },
    });

    return { acknowledged: true, deletedCount: 1 };
  }

  private toApiResponse(item: CartItem): CartApiResponse {
    return {
      _id: item.id,
      foodId: item.foodId,
      email: item.email,
      name: item.name,
      image: item.image,
      price: Number(item.price),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
