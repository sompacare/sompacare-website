import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const req = context.switchToHttp().getRequest<{
      method?: string;
      route?: { path?: string };
      url?: string;
    }>();
    const method = req.method ?? "GET";
    const route = req.route?.path ?? req.url ?? "unknown";

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<{ statusCode?: number }>();
          this.metricsService.recordRequest(
            method,
            route,
            res.statusCode ?? 200,
            Date.now() - started
          );
        },
        error: (err: { status?: number }) => {
          this.metricsService.recordRequest(
            method,
            route,
            err?.status ?? 500,
            Date.now() - started
          );
        },
      })
    );
  }
}
