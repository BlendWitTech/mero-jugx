import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from '../prometheus.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      const route = req.route?.path || req.path;
      const method = req.method;
      const statusCode = res.statusCode.toString();

      // Record metrics
      this.prometheusService.httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        duration,
      );

      this.prometheusService.httpRequestTotal.inc({
        method,
        route,
        status_code: statusCode,
      });

      // Record errors (4xx and 5xx)
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
        this.prometheusService.httpRequestErrors.inc({
          method,
          route,
          error_type: errorType,
        });
      }
    });

    next();
  }
}

