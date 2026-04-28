import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

type MenuApiResponse = {
  _id: string;
  name: string;
  recipe: string;
  image: string;
  category: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MenuApiResponse[]> {
    const items = await this.prisma.menuItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.toApiResponse(item));
  }

  async create(data: CreateMenuItemDto): Promise<MenuApiResponse> {
    const item = await this.prisma.menuItem.create({
      data: {
        ...data,
        price: data.price,
      },
    });
    return this.toApiResponse(item);
  }

  async remove(id: string): Promise<MenuApiResponse> {
    const existing = await this.prisma.menuItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({ message: 'menu item not found' });
    }

    const deleted = await this.prisma.menuItem.delete({
      where: { id: existing.id },
    });
    return this.toApiResponse(deleted);
  }

  private toApiResponse(item: MenuItem): MenuApiResponse {
    return {
      _id: item.id,
      name: item.name,
      recipe: item.recipe,
      image: item.image,
      category: item.category,
      price: Number(item.price),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
