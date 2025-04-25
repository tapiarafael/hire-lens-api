import { pgTable, uuid, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { files } from './files';
import { timestamps } from './helpers/columns';
import { ResumeStatus } from 'src/resume/types/resume-status.enum';

export const resumes = pgTable('resumes', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id')
    .notNull()
    .references(() => files.id),
  rawContent: text('raw_content').notNull(),
  summary: text('summary'),
  status: text('status').default(ResumeStatus.PENDING),
  suggestions: jsonb('suggestions'),
  score: integer('score'),
  llmParams: jsonb('llm_params'),
  ...timestamps,
});

export type Resume = typeof resumes.$inferSelect;
