CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"raw_page" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "jobs_resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"score" integer,
	"suggestions" jsonb,
	"summary" text,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs_resumes" ADD CONSTRAINT "jobs_resumes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_resumes" ADD CONSTRAINT "jobs_resumes_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_jobs_url" ON "jobs" USING btree ("url");--> statement-breakpoint
CREATE INDEX "idx_jobs_resumes_job_id" ON "jobs_resumes" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_resumes_resume_id" ON "jobs_resumes" USING btree ("resume_id");