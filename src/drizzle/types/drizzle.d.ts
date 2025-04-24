import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../tables/schema';

export type DrizzleDB = NodePgDatabase<schema>;
