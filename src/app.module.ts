import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResumeModule } from './resume/resume.module';
import { LoggerModule } from 'nestjs-pino';
import { AiModule } from './ai/ai.module';
import { BullModule } from '@nestjs/bullmq';

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
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_URL'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    StorageModule,
    ResumeModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
