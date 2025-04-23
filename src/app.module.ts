import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [DrizzleModule, AiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
