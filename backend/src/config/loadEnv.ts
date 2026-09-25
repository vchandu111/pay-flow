import path from 'node:path';
import dotenv from 'dotenv';

// Deliberately the only statement in this module: importing it as the very first
// import in an entrypoint (see server.ts) guarantees .env is loaded into
// process.env before any other module (e.g. config/env.ts) evaluates and reads it —
// ES module imports are evaluated depth-first in declaration order, so this file's
// side effect runs to completion before the next sibling import is even touched.
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env'), quiet: true });
