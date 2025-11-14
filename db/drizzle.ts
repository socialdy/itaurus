import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema'; // Import all schema components

const db = drizzle(process.env.DATABASE_URL!, { schema }); // Pass the entire schema object

export default db;