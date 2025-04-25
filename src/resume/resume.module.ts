import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { StorageModule } from 'src/storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from 'src/ai/ai.module';
import { ResumeProcessor } from './resume.processor';

@Module({
  providers: [ResumeService, ResumeProcessor],
  controllers: [ResumeController],
  imports: [
    StorageModule,
    DrizzleModule,
    AiModule,
    BullModule.registerQueue({
      name: 'RESUME_QUEUE',
    }),
  ],
})
export class ResumeModule {}
