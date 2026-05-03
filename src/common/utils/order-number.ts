import { randomBytes } from 'node:crypto';

/** Human-readable order id for `Order.orderNumber` (use when implementing customer checkout). */
export function generateOrderNumber(prefix = 'GG'): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}
