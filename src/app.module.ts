import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule } from '@nestjs/config';
import { ResumeModule } from './resume/resume.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    StorageModule,
    ResumeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
