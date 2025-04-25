import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ResumeFileValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    const oneMb = 1000000;
    const maxSize = oneMb * 2; // 2 MB

    if (!value) {
      throw new BadRequestException('File is required');
    }
    if (value.size > maxSize) {
      throw new BadRequestException(
        'File size exceeds the maximum limit of 2 MB',
      );
    }
    if (!value.mimetype.startsWith('application/pdf')) {
      throw new BadRequestException(
        'Invalid file type. Only PDF files are allowed',
      );
    }
    if (!value.originalname.endsWith('.pdf')) {
      throw new BadRequestException(
        'Invalid file name. Only PDF files are allowed',
      );
    }

    return value;
  }
}
