import { uuid, pgTable, text, index } from 'drizzle-orm/pg-core';
import { timestamps } from './helpers/columns';

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    url: text('url').notNull().unique(),
    title: text('title'),
    rawPage: text('raw_page'),
    description: text('description'),
    ...timestamps,
  },
  (table) => [index('idx_jobs_url').on(table.url)],
);

export type Job = typeof jobs.$inferSelect;
