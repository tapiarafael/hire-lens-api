import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from '../storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { files, File } from 'src/drizzle/schema';
import { DRIZZLE } from 'src/drizzle/drizzle.module';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly storagePath: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {
    this.storagePath = this.configService.get<string>('STORAGE_LOCAL_PATH')!;
  }

  async upload(file: Express.Multer.File): Promise<File> {
    const filename = file.filename || file.originalname;
    const targetPath = path.join(this.storagePath, filename);

    await fs.mkdir(this.storagePath);
    await fs.writeFile(targetPath, file.buffer);

    const [data] = await this.db
      .insert(files)
      .values({
        originalName: filename,
        size: file.size,
        mimetype: file.mimetype,
        path: targetPath,
      })
      .returning();

    return data;
  }
}
