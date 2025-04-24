import { pgTable, uuid, text, jsonb } from 'drizzle-orm/pg-core';
import { files } from './files';
import { timestamps } from './helpers/columns';
import { ResumeStatus } from 'src/resume/types/resume-status.enum';

export const resumes = pgTable('resumes', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id')
    .notNull()
    .references(() => files.id),
  content: text('content'),
  status: text('status').default(ResumeStatus.PENDING),
  suggestions: jsonb('suggestions'),
  ...timestamps,
});

export type Resume = typeof resumes.$inferSelect;
