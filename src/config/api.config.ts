export default () => ({
  api: {
    appName: process.env.APP_NAME ?? 'Ganges Grill',
    port: parsePort(process.env.PORT, 5000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    supportEmail: process.env.SUPPORT_EMAIL ?? '',
  },

  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parsePort(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    /** Prefer SMTP_PASS; GMAIL_PASSWORD kept for backward compatibility. */
    password: process.env.SMTP_PASS ?? process.env.GMAIL_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? '',
  },

  redis: {
    url: process.env.REDIS_URL ?? '',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parsePort(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
    username: process.env.REDIS_USERNAME ?? '',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? process.env.access_token ?? '',
    accessExpiresSec: parsePort(process.env.JWT_ACCESS_EXPIRES_SEC, 900),
    refreshExpiresDays: parsePort(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 7),
    /** Falls back to accessSecret at runtime where pepper is required (see AuthService). */
    otpPepper: process.env.OTP_PEPPER ?? '',
  },
});

function parsePort(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
