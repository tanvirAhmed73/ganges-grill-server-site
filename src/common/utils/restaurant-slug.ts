import type { PrismaClient } from '@prisma/client';

/** URL-safe slug from a display name. */
export function slugifyRestaurantName(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, 80) || 'restaurant';
}

/** Resolves `base` or `base-1`, `base-2`, … until unused. */
export async function uniqueRestaurantSlug(
  db: Pick<PrismaClient, 'restaurant'>,
  base: string,
): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const clash = await db.restaurant.findUnique({ where: { slug } });
    if (!clash) {
      return slug;
    }
    n += 1;
    slug = `${base}-${n}`;
  }
}
