import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Response } from 'express';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Res() response: Response) {
    const metrics = await this.metricsService.getMetrics();
    response.setHeader('Content-Type', 'text/plain');
    return response.send(metrics);
  }
}
