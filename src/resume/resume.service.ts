import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { Resume, resumes } from 'src/drizzle/tables/resumes';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { STORAGE_SERVICE } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class ResumeService {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
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
    const resume = {
      fileId: uploadedFile.id,
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };

    const [data] = await this.db.insert(resumes).values(resume).returning();

    return data;
  }
}
