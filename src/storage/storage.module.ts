import { Module, Provider } from '@nestjs/common';
import { LocalStorageService } from './implementation/local-storage.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageProvider } from './types/storage-provider.enum';
import { DRIZZLE, DrizzleModule } from 'src/drizzle/drizzle.module';
import { DrizzleDB } from 'src/drizzle/types/drizzle';

export const STORAGE_SERVICE = Symbol('storage-service');

const storageProvider: Provider = {
  provide: STORAGE_SERVICE,
  inject: [ConfigService, DRIZZLE],
  useFactory: (configService: ConfigService, db: DrizzleDB) => {
    const provider = configService.get<StorageProvider>('STORAGE_PROVIDER');
    switch (provider) {
      case StorageProvider.LOCAL:
        return new LocalStorageService(configService, db);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  },
};

@Module({
  imports: [ConfigModule, DrizzleModule],
  providers: [storageProvider],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
