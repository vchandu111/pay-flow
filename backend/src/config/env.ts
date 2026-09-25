import { z } from 'zod';

// Loading the .env file is a bootstrap concern handled by each entrypoint
// (server.ts imports ./loadEnv.js first; tests set process.env directly in
// tests/setup/env.ts) — this module only validates whatever is already in
// process.env by the time it's imported.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(14),

  COOKIE_DOMAIN: z.string().default('localhost'),
  CORS_ORIGIN: z.string().default('http://localhost:5180'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration — see errors above.');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
