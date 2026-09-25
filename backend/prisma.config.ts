import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// .env lives at the repo root, not in backend/ — Prisma's config-file mode disables
// its implicit .env auto-discovery, so it's loaded explicitly here.
dotenv.config({ path: path.resolve(import.meta.dirname, '../.env'), quiet: true });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
