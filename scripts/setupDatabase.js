import { readFile } from 'node:fs/promises';
import { pool } from '../src/config/database.js';

try {
  // Resolve the schema relative to this script, regardless of the current folder.
  const schema = await readFile(
    new URL('../database/schema.sql', import.meta.url),
    'utf8',
  );

  await pool.query(schema);
  console.log('Task database is ready. Existing tasks have been preserved.');
} catch (error) {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
