import {
  pgTable,
  uuid,
  text,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { jobs, resumes } from '../schema';
import { timestamps } from './helpers/columns';

export const jobsResumes = pgTable(
  'jobs_resumes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id),
    resumeId: uuid('resume_id')
      .notNull()
      .references(() => resumes.id),
    score: integer('score'),
    suggestions: jsonb('suggestions'),
    summary: text('summary'),
    status: text('status'),
    ...timestamps,
  },
  (table) => [
    index('idx_jobs_resumes_job_id').on(table.jobId),
    index('idx_jobs_resumes_resume_id').on(table.resumeId),
  ],
);
