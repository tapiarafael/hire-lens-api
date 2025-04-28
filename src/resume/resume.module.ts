import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { StorageModule } from 'src/storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from 'src/ai/ai.module';
import { RESUME_QUEUE, ResumeProcessor } from './processors/resume.processor';
import {
  JOB_RESUME_QUEUE,
  JobResumeProcessor,
} from './processors/job-resume.processor';

@Module({
  providers: [ResumeService, ResumeProcessor, JobResumeProcessor],
  controllers: [ResumeController],
  imports: [
    StorageModule,
    DrizzleModule,
    AiModule,
    BullModule.registerQueue({
      name: RESUME_QUEUE,
    }),
    BullModule.registerQueue({
      name: JOB_RESUME_QUEUE,
    }),
  ],
})
export class ResumeModule {}
