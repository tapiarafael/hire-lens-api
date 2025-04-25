import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeFileValidationPipe } from './pipes/resume-validation.pipe';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get(':id')
  getResumeById(@Param('id') id: string) {
    return this.resumeService.getResumeById(id);
  }

  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  analyzeResume(
    @UploadedFile(new ResumeFileValidationPipe()) file: Express.Multer.File,
  ) {
    return this.resumeService.analyzeResume(file);
  }
}
