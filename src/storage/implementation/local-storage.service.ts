import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly storagePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>('STORAGE_LOCAL_PATH')!;
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const filename = file.filename || file.originalname;
    const targetPath = path.join(this.storagePath, filename);

    await fs.mkdir(this.storagePath);
    await fs.writeFile(targetPath, file.buffer);

    return targetPath;
  }
}
