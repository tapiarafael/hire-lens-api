import { pgTable, uuid, text, jsonb } from 'drizzle-orm/pg-core';
import { files } from './files';
import { timestamps } from './helpers/columns';

export const resumes = pgTable('resumes', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id')
    .notNull()
    .references(() => files.id),
  content: text('content'),
  status: text('status').default('processing'),
  suggestions: jsonb('suggestions'),
  ...timestamps,
});

export type Resume = typeof resumes.$inferSelect;
