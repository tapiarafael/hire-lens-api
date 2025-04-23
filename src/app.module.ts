import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
