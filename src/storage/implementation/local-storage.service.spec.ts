import { Test, TestingModule } from '@nestjs/testing';
import { LocalStorageService } from './local-storage.service';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');

const mockConfigService = {
  get: jest.fn(),
};

const mockDrizzleDB = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest
        .fn()
        .mockResolvedValue([{ id: 'mock-id', path: 'mock-path' }]),
    }),
  }),
};

const mockStoragePath = '/mock/storage/path';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue(mockStoragePath);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DRIZZLE, useValue: mockDrizzleDB },
      ],
    }).compile();

    service = module.get<LocalStorageService>(LocalStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#upload', () => {
    it('should not create the storage directory if it already exists', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('test content'),
        size: 123,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      const mockStoragePath = '/mock/storage/path';
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

      mockConfigService.get.mockReturnValue(mockStoragePath);
      jest.spyOn(global.crypto, 'randomUUID').mockReturnValue(mockUUID);
      (fs.stat as jest.Mock).mockResolvedValueOnce(true);
      (fs.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

      const insertedData = await service.upload(mockFile);

      expect(insertedData).toMatchObject({
        id: 'mock-id',
        path: 'mock-path',
      });
      expect(fs.stat).toHaveBeenCalledWith(mockStoragePath);
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it('should handle the file upload and save metadata on db', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('test content'),
        size: 123,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(global.crypto, 'randomUUID').mockReturnValue(mockUUID);
      (fs.stat as jest.Mock).mockResolvedValueOnce(false);
      (fs.mkdir as jest.Mock).mockResolvedValueOnce(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

      const insertedData = await service.upload(mockFile);

      expect(insertedData).toMatchObject({
        id: 'mock-id',
        path: 'mock-path',
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockStoragePath, `${mockUUID}.txt`),
        mockFile.buffer,
      );
      expect(mockDrizzleDB.insert).toHaveBeenCalled();
      expect(fs.stat).toHaveBeenCalledWith(mockStoragePath);
      expect(fs.mkdir).toHaveBeenCalledWith(mockStoragePath, {
        recursive: true,
      });
    });
  });
});
