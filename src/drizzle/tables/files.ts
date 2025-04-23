import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';
import { timestamps } from './helpers/columns';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalName: text('original_name').notNull(),
  path: text('path').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  ...timestamps,
});
