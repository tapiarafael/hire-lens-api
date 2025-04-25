ALTER TABLE "resumes" RENAME COLUMN "content" TO "raw_content";--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "llm_params" jsonb;