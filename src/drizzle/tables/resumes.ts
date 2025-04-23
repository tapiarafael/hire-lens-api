import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
});
