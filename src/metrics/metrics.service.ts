import { Injectable } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpRequestCounter: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'hire-lens-api' });
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestCounter.labels(method, route, statusCode.toString()).inc();
  }

  observeHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }

  async getMetrics() {
    return this.registry.metrics();
  }
}
