import { UserRole } from '@prisma/client';

/** Payload embedded in access JWT (resource API). */
export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
}
