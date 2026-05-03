import { Injectable } from '@nestjs/common';
import { RestaurantBusinessStatus, RestaurantSection } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CuisineDto = { name: string; image: string };
export type DailyDealDto = {
  title: string;
  subtitle: string;
  image: string;
  bgClass: string;
};
export type RestaurantCardDto = {
  name: string;
  category: string;
  eta: string;
  rating: number;
  image: string;
};
export type TopBrandDto = { name: string; colorClass: string };

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  private async restaurantsForSection(section: RestaurantSection): Promise<RestaurantCardDto[]> {
    const placements = await this.prisma.restaurantPlacement.findMany({
      where: {
        section,
        restaurant: { status: RestaurantBusinessStatus.active },
      },
      orderBy: { sortOrder: 'asc' },
      include: { restaurant: true },
    });
    return placements.map((p) => ({
      name: p.restaurant.name,
      category: p.restaurant.category,
      eta: p.restaurant.eta,
      rating: Number(p.restaurant.rating),
      image: p.restaurant.image,
    }));
  }

  /** Full homepage bundle matching common frontend static-module shapes. */
  async getHomePayload(): Promise<{
    cuisines: CuisineDto[];
    dailyDeals: DailyDealDto[];
    featuredRestaurants: RestaurantCardDto[];
    dealNaoRestaurants: RestaurantCardDto[];
    fastDeliveryRestaurants: RestaurantCardDto[];
    topBrands: TopBrandDto[];
    cuisineMap: Record<string, string[]>;
    dealMap: Record<string, string[]>;
    allRestaurants: RestaurantCardDto[];
  }> {
    const [cuisineRows, dealRows, brandRows] = await Promise.all([
      this.prisma.cuisine.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.dailyDeal.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.topBrand.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const cuisines: CuisineDto[] = cuisineRows.map((c) => ({
      name: c.name,
      image: c.image,
    }));

    const dailyDeals: DailyDealDto[] = dealRows.map((d) => ({
      title: d.title,
      subtitle: d.subtitle,
      image: d.image,
      bgClass: d.bgClass,
    }));

    const cuisineMap: Record<string, string[]> = {};
    for (const c of cuisineRows) {
      cuisineMap[c.name] = c.filterTags as string[];
    }

    const dealMap: Record<string, string[]> = {};
    for (const d of dealRows) {
      dealMap[d.title] = d.filterTags as string[];
    }

    const [featuredRestaurants, dealNaoRestaurants, fastDeliveryRestaurants] = await Promise.all([
      this.restaurantsForSection(RestaurantSection.featured),
      this.restaurantsForSection(RestaurantSection.deal_nao),
      this.restaurantsForSection(RestaurantSection.fast_delivery),
    ]);

    const seen = new Set<string>();
    const allRestaurants: RestaurantCardDto[] = [];
    for (const list of [
      featuredRestaurants,
      dealNaoRestaurants,
      fastDeliveryRestaurants,
    ]) {
      for (const r of list) {
        const key = r.name;
        if (!seen.has(key)) {
          seen.add(key);
          allRestaurants.push(r);
        }
      }
    }

    const topBrands: TopBrandDto[] = brandRows.map((b) => ({
      name: b.name,
      colorClass: b.colorClass,
    }));

    return {
      cuisines,
      dailyDeals,
      featuredRestaurants,
      dealNaoRestaurants,
      fastDeliveryRestaurants,
      topBrands,
      cuisineMap,
      dealMap,
      allRestaurants,
    };
  }
}
