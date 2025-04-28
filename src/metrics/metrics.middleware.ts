import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime(); // High resolution timer

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationInSeconds = seconds + nanoseconds / 1e9;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const route = (req.route?.path || req.url || 'unknown') as string;

      this.metricsService.incrementHttpRequests(
        req.method,
        route,
        res.statusCode,
      );
      this.metricsService.observeHttpRequestDuration(
        req.method,
        route,
        res.statusCode,
        durationInSeconds,
      );
    });

    next();
  }
}
