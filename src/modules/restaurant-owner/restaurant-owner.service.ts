import { HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus, Restaurant, RestaurantProduct } from '@prisma/client';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { slugifyRestaurantName, uniqueRestaurantSlug } from '../../common/utils/restaurant-slug';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthErrorCode } from '../auth/constants/error-codes';
import { CreateRestaurantProductDto } from './dto/create-product.dto';
import { UpdateRestaurantProductDto } from './dto/update-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

/** Allowed status transitions for the vendor dashboard (customer checkout sets `pending_acceptance`). */
const OWNER_ALLOWED_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_acceptance: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled_by_restaurant'],
  preparing: ['ready_for_pickup', 'cancelled_by_restaurant'],
  ready_for_pickup: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
};

function assertOwnerTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = OWNER_ALLOWED_NEXT[from];
  if (!allowed?.includes(to)) {
    throw new AppHttpException(
      HttpStatus.BAD_REQUEST,
      AuthErrorCode.VALIDATION_FAILED,
      `Cannot move order from ${from} to ${to}.`,
    );
  }
}

@Injectable()
export class RestaurantOwnerService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnedRestaurant(ownerId: string): Promise<Restaurant> {
    const row = await this.prisma.restaurant.findUnique({
      where: { ownerId },
    });
    if (!row) {
      throw new AppHttpException(
        HttpStatus.NOT_FOUND,
        AuthErrorCode.ACCOUNT_INCOMPLETE,
        'No restaurant is linked to this account.',
      );
    }
    return row;
  }

  private restaurantJson(r: Restaurant) {
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      phone: r.phone,
      addressLine1: r.addressLine1,
      city: r.city,
      postalCode: r.postalCode,
      category: r.category,
      eta: r.eta,
      rating: Number(r.rating),
      image: r.image,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private productJson(p: RestaurantProduct) {
    return {
      id: p.id,
      restaurantId: p.restaurantId,
      name: p.name,
      description: p.description,
      image: p.image,
      category: p.category,
      price: Number(p.price),
      isAvailable: p.isAvailable,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async getMyRestaurant(ownerId: string) {
    const r = await this.getOwnedRestaurant(ownerId);
    return { restaurant: this.restaurantJson(r) };
  }

  async updateMyRestaurant(ownerId: string, dto: UpdateRestaurantDto) {
    const r = await this.getOwnedRestaurant(ownerId);

    if (dto.slug !== undefined) {
      const normalized = slugifyRestaurantName(dto.slug);
      const clash = await this.prisma.restaurant.findFirst({
        where: { slug: normalized, NOT: { id: r.id } },
      });
      if (clash) {
        throw new AppHttpException(
          HttpStatus.CONFLICT,
          AuthErrorCode.VALIDATION_FAILED,
          'That slug is already taken.',
        );
      }
    }

    const updated = await this.prisma.restaurant.update({
      where: { id: r.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }),
        ...(dto.addressLine1 !== undefined && { addressLine1: dto.addressLine1.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city.trim() || null }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode.trim() || null }),
        ...(dto.category !== undefined && { category: dto.category.trim() }),
        ...(dto.eta !== undefined && { eta: dto.eta.trim() }),
        ...(dto.image !== undefined && { image: dto.image.trim() }),
        ...(dto.slug !== undefined && { slug: slugifyRestaurantName(dto.slug) }),
      },
    });

    return { restaurant: this.restaurantJson(updated) };
  }

  async listProducts(ownerId: string) {
    const r = await this.getOwnedRestaurant(ownerId);
    const items = await this.prisma.restaurantProduct.findMany({
      where: { restaurantId: r.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { products: items.map((p) => this.productJson(p)) };
  }

  async createProduct(ownerId: string, dto: CreateRestaurantProductDto) {
    const r = await this.getOwnedRestaurant(ownerId);
    const created = await this.prisma.restaurantProduct.create({
      data: {
        restaurantId: r.id,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
        image: dto.image.trim(),
        category: dto.category.trim(),
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return { product: this.productJson(created) };
  }

  async updateProduct(ownerId: string, productId: string, dto: UpdateRestaurantProductDto) {
    const r = await this.getOwnedRestaurant(ownerId);
    const existing = await this.prisma.restaurantProduct.findFirst({
      where: { id: productId, restaurantId: r.id },
    });
    if (!existing) {
      throw new AppHttpException(HttpStatus.NOT_FOUND, AuthErrorCode.VALIDATION_FAILED, 'Product not found.');
    }

    const updated = await this.prisma.restaurantProduct.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image !== undefined && { image: dto.image.trim() }),
        ...(dto.category !== undefined && { category: dto.category.trim() }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    return { product: this.productJson(updated) };
  }

  async deleteProduct(ownerId: string, productId: string) {
    const r = await this.getOwnedRestaurant(ownerId);
    const existing = await this.prisma.restaurantProduct.findFirst({
      where: { id: productId, restaurantId: r.id },
    });
    if (!existing) {
      throw new AppHttpException(HttpStatus.NOT_FOUND, AuthErrorCode.VALIDATION_FAILED, 'Product not found.');
    }

    await this.prisma.restaurantProduct.delete({ where: { id: existing.id } });
    return { deleted: true };
  }

  async listOrders(ownerId: string, status?: OrderStatus) {
    const r = await this.getOwnedRestaurant(ownerId);
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId: r.id,
        ...(status !== undefined ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: Number(o.subtotal),
        deliveryFee: Number(o.deliveryFee),
        tax: Number(o.tax),
        total: Number(o.total),
        deliveryAddressLine1: o.deliveryAddressLine1,
        deliveryCity: o.deliveryCity,
        deliveryPhone: o.deliveryPhone,
        customerNotes: o.customerNotes,
        customer: o.customer,
        items: o.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          unitPrice: Number(it.unitPrice),
          quantity: it.quantity,
          lineTotal: Number(it.lineTotal),
        })),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    };
  }

  async getOrder(ownerId: string, orderId: string) {
    const r = await this.getOwnedRestaurant(ownerId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: r.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
    if (!order) {
      throw new AppHttpException(HttpStatus.NOT_FOUND, AuthErrorCode.VALIDATION_FAILED, 'Order not found.');
    }

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        tax: Number(order.tax),
        total: Number(order.total),
        deliveryAddressLine1: order.deliveryAddressLine1,
        deliveryCity: order.deliveryCity,
        deliveryPhone: order.deliveryPhone,
        customerNotes: order.customerNotes,
        customer: order.customer,
        items: order.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          unitPrice: Number(it.unitPrice),
          quantity: it.quantity,
          lineTotal: Number(it.lineTotal),
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    };
  }

  async updateOrderStatus(ownerId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const r = await this.getOwnedRestaurant(ownerId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: r.id },
    });
    if (!order) {
      throw new AppHttpException(HttpStatus.NOT_FOUND, AuthErrorCode.VALIDATION_FAILED, 'Order not found.');
    }

    if (order.status === dto.status) {
      return this.getOrder(ownerId, orderId);
    }

    assertOwnerTransition(order.status, dto.status);

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: dto.status },
    });

    return this.getOrder(ownerId, updated.id);
  }
}
