import {
  BadRequestException,
  Body,
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

  // Maybe this should be in a different controller or even a different module
  @Get(':id/job/:jobId')
  getJobAnalyzis(@Param('jobId') id: string) {
    return this.resumeService.getJobCompatibility(id);
  }

  @Post(':id/job')
  analyzeJobResume(@Param('id') id: string, @Body('jobUrl') jobUrl: string) {
    // This could be done with a DTO and class-validator
    if (!jobUrl || typeof jobUrl !== 'string' || jobUrl.trim() === '') {
      throw new BadRequestException('jobUrl is required');
    }

    const urlPattern = new RegExp('^(http|https)://');
    if (!urlPattern.test(jobUrl)) {
      throw new BadRequestException('Invalid job URL format');
    }

    return this.resumeService.analyzeJobResume(id, jobUrl);
  }
}
