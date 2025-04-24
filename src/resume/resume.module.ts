import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  providers: [ResumeService],
  controllers: [ResumeController],
  imports: [StorageModule, DrizzleModule],
})
export class ResumeModule {}
