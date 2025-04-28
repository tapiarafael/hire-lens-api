import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { Resume, resumes } from 'src/drizzle/tables/resumes';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { STORAGE_SERVICE } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';
import { ResumeStatus } from './types/resume-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as pdf from 'pdf-parse';
import { RESUME_QUEUE } from './processors/resume.processor';
import { JOB_RESUME_QUEUE } from './processors/job-resume.processor';
import { jobs, jobsResumes } from 'src/drizzle/schema';

@Injectable()
export class ResumeService {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    @InjectQueue(RESUME_QUEUE)
    private readonly resumeQueue: Queue,
    @InjectQueue(JOB_RESUME_QUEUE)
    private readonly jobResumeQueue: Queue,
  ) {}

  async getResumeById(id: string): Promise<Partial<Resume>> {
    const [result] = await this.db
      .select({
        id: resumes.id,
        status: resumes.status,
        score: resumes.score,
        suggestions: resumes.suggestions,
        summary: resumes.summary,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt,
      })
      .from(resumes)
      .where(eq(resumes.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Resume not found');
    }

    return result;
  }

  async analyzeResume(file: Express.Multer.File) {
    const uploadedFile = await this.storageService.upload(file);

    const rawResumeContent = await pdf(file.buffer);

    const [data] = await this.db
      .insert(resumes)
      .values({
        fileId: uploadedFile.id,
        status: ResumeStatus.PENDING,
        rawContent: rawResumeContent.text,
      })
      .returning({
        id: resumes.id,
        status: resumes.status,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt,
      });

    await this.resumeQueue.add('analyze-resume', { resumeId: data.id });

    return data;
  }

  async analyzeJobResume(resumeId: string, jobUrl: string) {
    const [resume] = await this.db
      .select({
        id: resumes.id,
      })
      .from(resumes)
      .where(eq(resumes.id, resumeId))
      .limit(1);

    if (!resume?.id) {
      throw new NotFoundException('Resume not found');
    }

    // The parser seems not to support LinkedIn job URLs
    if (jobUrl.includes('linkedin.com')) {
      throw new NotFoundException('LinkedIn job URLs are not supported');
    }

    // These queries should be extracted to a repository
    const [job] = await this.db
      .insert(jobs)
      .values({
        url: jobUrl,
      })
      // This is to return the job ID in case of conflict
      .onConflictDoUpdate({
        set: {
          url: jobUrl,
        },
        target: jobs.url,
      })
      .returning({
        id: jobs.id,
      });

    const [jobResume] = await this.db
      .insert(jobsResumes)
      .values({
        jobId: job.id,
        resumeId: resume.id,
        status: ResumeStatus.PENDING,
      })
      .onConflictDoNothing()
      .returning({
        id: jobsResumes.id,
        resumeId: jobsResumes.resumeId,
        status: jobsResumes.status,
        createdAt: jobsResumes.createdAt,
        updatedAt: jobsResumes.updatedAt,
      });

    await this.jobResumeQueue.add('analyze-job-resume', {
      jobId: job.id,
      resumeId,
    });

    return jobResume;
  }

  async getJobCompatibility(jobResumeId: string) {
    const [jobResume] = await this.db
      .select({
        id: jobsResumes.id,
        resumeId: jobsResumes.resumeId,
        score: jobsResumes.score,
        suggestions: jobsResumes.suggestions,
        summary: jobsResumes.summary,
        status: jobsResumes.status,
        jobTitle: jobs.title,
        jobUrl: jobs.url,
        jobDescription: jobs.description,
        createdAt: jobsResumes.createdAt,
        updatedAt: jobsResumes.updatedAt,
      })
      .from(jobsResumes)
      .where(eq(jobsResumes.id, jobResumeId))
      .innerJoin(jobs, eq(jobs.id, jobsResumes.jobId))
      .limit(1);

    if (!jobResume) {
      throw new NotFoundException('Job resume not found');
    }

    return jobResume;
  }
}
