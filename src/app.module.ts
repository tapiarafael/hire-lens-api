import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DrizzleModule,
    StorageModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
