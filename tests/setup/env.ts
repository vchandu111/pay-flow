import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

process.env.NODE_ENV = 'test';

// Point the app's DATABASE_URL at the dedicated test database, never the dev one.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
