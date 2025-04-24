import { File } from 'src/drizzle/schema';

export interface StorageService {
  upload(file: Express.Multer.File): Promise<File>;
}
