import { Module, Provider } from '@nestjs/common';
import { LocalStorageService } from './implementation/local-storage.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageProvider } from './types/storage-provider.enum';

const storageProvider: Provider = {
  provide: 'StorageService',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const provider = configService.get<StorageProvider>('STORAGE_PROVIDER');
    switch (provider) {
      case StorageProvider.LOCAL:
        return new LocalStorageService(configService);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  },
};

@Module({
  imports: [ConfigModule],
  providers: [storageProvider],
  exports: [storageProvider],
})
export class StorageModule {}
