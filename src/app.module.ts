import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule } from '@nestjs/config';
import { ResumeModule } from './resume/resume.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({
          context: 'HTTP',
        }),
        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true },
              },
            }
          : {}),
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    StorageModule,
    ResumeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
