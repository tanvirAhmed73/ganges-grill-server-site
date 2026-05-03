/**
 * Loads homepage discovery data into Postgres (run after migrations).
 * Only updates/creates **catalog** restaurants (`ownerId` null) so vendor-owned rows are never touched.
 * Usage: npx prisma db seed
 */
import {
  PrismaClient,
  RestaurantBusinessStatus,
  RestaurantSection,
} from '@prisma/client';

const prisma = new PrismaClient();

function slugifyCatalogName(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, 80) || 'restaurant';
}

/** Picks a unique `slug` for seed rows; allows keeping slug when re-seeding the same id. */
async function uniqueCatalogSlug(base: string, forRestaurantId?: string): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const found = await prisma.restaurant.findUnique({ where: { slug } });
    if (!found || found.id === forRestaurantId) {
      return slug;
    }
    n += 1;
    slug = `${base}-${n}`;
  }
}

const cuisinesSeed = [
  {
    name: 'Pizza',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    tags: ['pizza'],
  },
  {
    name: 'Biryani',
    image:
      'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=800&q=80',
    tags: ['biryani'],
  },
  {
    name: 'Burgers',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    tags: ['burger'],
  },
  {
    name: 'Bangladeshi',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    tags: ['bangladeshi'],
  },
  {
    name: 'Cakes',
    image:
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80',
    tags: ['cake', 'bakery'],
  },
  {
    name: 'Fast Food',
    image:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    tags: ['fast food', 'snacks', 'shawarma'],
  },
  {
    name: 'Cafe',
    image:
      'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=800&q=80',
    tags: ['cafe', 'bakery'],
  },
  {
    name: 'Rice Dishes',
    image:
      'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?auto=format&fit=crop&w=800&q=80',
    tags: ['rice', 'rice bowl'],
  },
];

const dailyDealsSeed = [
  {
    title: 'Flat 60% off',
    subtitle: 'With selected partners',
    image:
      'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=1000&q=80',
    bgClass: 'from-fuchsia-500 to-pink-500',
    tags: ['burger', 'pizza', 'fast food'],
  },
  {
    title: '50% off',
    subtitle: 'Weekend favorites',
    image:
      'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1000&q=80',
    bgClass: 'from-orange-500 to-amber-400',
    tags: ['biryani', 'rice', 'asian'],
  },
  {
    title: 'Exclusive treats',
    subtitle: 'Only in the app',
    image:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1000&q=80',
    bgClass: 'from-rose-500 to-pink-400',
    tags: ['cafe', 'bakery', 'snacks'],
  },
  {
    title: 'Dealnao',
    subtitle: 'Tk 150 off this week',
    image:
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1000&q=80',
    bgClass: 'from-violet-500 to-fuchsia-500',
    tags: ['bangladeshi', 'grill', 'shawarma'],
  },
];

type RestPayload = {
  name: string;
  category: string;
  eta: string;
  rating: number;
  image: string;
};

const featuredRestaurants: RestPayload[] = [
  {
    name: 'Ma Biryani - Gulshan',
    category: 'Rice, Biryani',
    eta: '25 min',
    rating: 4.3,
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Rice on Fire',
    category: 'Asian, Rice Bowl',
    eta: '30 min',
    rating: 4.5,
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Shawarma N Kebab',
    category: 'Middle Eastern',
    eta: '35 min',
    rating: 4.4,
    image:
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Arrowhead Grill',
    category: 'BBQ, Grill',
    eta: '30 min',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
  },
];

const dealNaoRestaurants: RestPayload[] = [
  {
    name: 'AArash',
    category: 'Bangladeshi',
    eta: '18 min',
    rating: 4.2,
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Burger Xpress',
    category: 'Burger',
    eta: '20 min',
    rating: 4.4,
    image:
      'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: "Sultan's Dine",
    category: 'Biryani, Grill',
    eta: '26 min',
    rating: 4.5,
    image:
      'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Bhoj Fry',
    category: 'Fast Food',
    eta: '24 min',
    rating: 4.1,
    image:
      'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1000&q=80',
  },
];

const fastDeliveryRestaurants: RestPayload[] = [
  {
    name: 'Care Cafe',
    category: 'Cafe, Bakery',
    eta: '15 min',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Kacchi Bhai',
    category: 'Bangladeshi',
    eta: '17 min',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Burger Xpress',
    category: 'Burgers',
    eta: '19 min',
    rating: 4.4,
    image:
      'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Leto Food',
    category: 'Snacks',
    eta: '20 min',
    rating: 4.3,
    image:
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=80',
  },
];

const topBrandsSeed = [
  { name: 'Kacchi Bhai', colorClass: 'bg-red-500' },
  { name: 'Burger Xpress', colorClass: 'bg-blue-500' },
  { name: "Sultan's Dine", colorClass: 'bg-black' },
  { name: 'KFC', colorClass: 'bg-red-600' },
  { name: 'Care Cafe', colorClass: 'bg-emerald-600' },
  { name: 'Leto Food', colorClass: 'bg-orange-600' },
];

async function upsertRestaurant(row: RestPayload): Promise<string> {
  const existing = await prisma.restaurant.findFirst({
    where: { name: row.name, ownerId: null },
  });

  if (existing) {
    const slug =
      existing.slug ??
      (await uniqueCatalogSlug(slugifyCatalogName(row.name), existing.id));

    await prisma.restaurant.update({
      where: { id: existing.id },
      data: {
        category: row.category,
        eta: row.eta,
        rating: row.rating,
        image: row.image,
        status: RestaurantBusinessStatus.active,
        description: existing.description ?? '',
        slug,
      },
    });
    return existing.id;
  }

  const baseSlug = slugifyCatalogName(row.name);
  const slug = await uniqueCatalogSlug(baseSlug);

  const created = await prisma.restaurant.create({
    data: {
      name: row.name,
      slug,
      category: row.category,
      eta: row.eta,
      rating: row.rating,
      image: row.image,
      description: '',
      status: RestaurantBusinessStatus.active,
    },
  });
  return created.id;
}

async function seedPlacements(
  rows: RestPayload[],
  section: RestaurantSection,
): Promise<void> {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const restaurantId = await upsertRestaurant(row);
    await prisma.restaurantPlacement.upsert({
      where: {
        restaurantId_section: {
          restaurantId,
          section,
        },
      },
      create: {
        restaurantId,
        section,
        sortOrder: i,
      },
      update: { sortOrder: i },
    });
  }
}

async function main(): Promise<void> {
  for (let i = 0; i < cuisinesSeed.length; i++) {
    const c = cuisinesSeed[i];
    await prisma.cuisine.upsert({
      where: { name: c.name },
      create: {
        name: c.name,
        image: c.image,
        sortOrder: i,
        filterTags: c.tags,
      },
      update: {
        image: c.image,
        sortOrder: i,
        filterTags: c.tags,
      },
    });
  }

  for (let i = 0; i < dailyDealsSeed.length; i++) {
    const d = dailyDealsSeed[i];
    await prisma.dailyDeal.upsert({
      where: { title: d.title },
      create: {
        title: d.title,
        subtitle: d.subtitle,
        image: d.image,
        bgClass: d.bgClass,
        sortOrder: i,
        filterTags: d.tags,
      },
      update: {
        subtitle: d.subtitle,
        image: d.image,
        bgClass: d.bgClass,
        sortOrder: i,
        filterTags: d.tags,
      },
    });
  }

  await seedPlacements(featuredRestaurants, RestaurantSection.featured);
  await seedPlacements(dealNaoRestaurants, RestaurantSection.deal_nao);
  await seedPlacements(fastDeliveryRestaurants, RestaurantSection.fast_delivery);

  for (let i = 0; i < topBrandsSeed.length; i++) {
    const b = topBrandsSeed[i];
    await prisma.topBrand.upsert({
      where: { name: b.name },
      create: {
        name: b.name,
        colorClass: b.colorClass,
        sortOrder: i,
      },
      update: {
        colorClass: b.colorClass,
        sortOrder: i,
      },
    });
  }

  console.log(
    'Seed finished: cuisines, daily deals, catalog restaurants (active + slugs), placements, top brands.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
