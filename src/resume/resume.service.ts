import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class ResumeService {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    @InjectQueue('RESUME_QUEUE')
    private readonly resumeQueue: Queue,
  ) {}

  async getResumeById(id: string): Promise<Resume | null> {
    const result = await this.db
      .select()
      .from(resumes)
      .where(eq(resumes.id, id))
      .limit(1);

    return result[0] || null;
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
}
