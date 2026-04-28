export type JwtPayload = {
  userEmail?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};
