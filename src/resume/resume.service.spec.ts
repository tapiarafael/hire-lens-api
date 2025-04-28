import { Test, TestingModule } from '@nestjs/testing';
import { ResumeService } from './resume.service';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { STORAGE_SERVICE } from 'src/storage/storage.module';

// These mocks should go in a separate file for better organization and reusability
const mockConfigService = {
  get: jest.fn(),
};

const mockQueue = {
  add: jest.fn().mockResolvedValue({}),
};

const mockDrizzleDB = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest
        .fn()
        .mockResolvedValue([{ id: 'mock-id', path: 'mock-path' }]),
    }),
  }),
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
};

const mockLocalStorageService = {
  upload: jest.fn().mockResolvedValue({
    id: 'mock-id',
  }),
};

describe('ResumeService', () => {
  let service: ResumeService;

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('mocked_config_value');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DRIZZLE, useValue: mockDrizzleDB },
        { provide: STORAGE_SERVICE, useValue: mockLocalStorageService },
        { provide: 'BullQueue_RESUME_QUEUE', useValue: mockQueue },
        { provide: 'BullQueue_JOB_RESUME_QUEUE', useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#getResumeById', () => {
    it('should return a resume when a valid ID is provided', async () => {
      const mockResume = {
        id: 'uuid',
        status: 'PENDING',
        score: 0,
        suggestions: [],
        summary: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDrizzleDB.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockResume]),
          }),
        }),
      });

      const result = await service.getResumeById('uuid');

      expect(result).toEqual(mockResume);
      expect(mockDrizzleDB.select).toHaveBeenCalled();
    });

    it('should throw NotFoundException when an invalid ID is provided', async () => {
      mockDrizzleDB.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getResumeById('invalid-id')).rejects.toThrow(
        'Resume not found',
      );
      expect(mockDrizzleDB.select).toHaveBeenCalled();
    });
  });

  describe('#analyzeResume', () => {
    it.skip('should upload a file and add a job to the queue', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from(''),
        size: 123,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      // const pdfMock = pdf as unknown as jest.Mock;
      mockDrizzleDB.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: 'mock-id', status: 'PENDING' }]),
        }),
      });

      const result = await service.analyzeResume(mockFile);

      expect(result).toEqual({ id: 'mock-id', status: 'PENDING' });
      // expect(pdfMock).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockLocalStorageService.upload).toHaveBeenCalledWith(mockFile);
      expect(mockDrizzleDB.insert).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('analyze-resume', {
        resumeId: 'mock-id',
      });
    });
  });
});
