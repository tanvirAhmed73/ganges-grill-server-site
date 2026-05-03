import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthErrorCode } from '../../modules/auth/constants/error-codes';
import { AppHttpException, ErrorBody } from '../exceptions/app-http.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      statusCode: status,
      code: AuthErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    };

    if (exception instanceof AppHttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'statusCode' in res) {
        body = res as ErrorBody;
      }
      status = exception.getStatus();
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        body = {
          statusCode: status,
          code: mapHttpStatusToCode(status),
          message: res,
        };
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        body = {
          statusCode: status,
          code:
            (typeof r.code === 'string' ? r.code : mapHttpStatusToCode(status)) ??
            mapHttpStatusToCode(status),
          message:
            typeof r.message === 'string'
              ? r.message
              : Array.isArray(r.message)
                ? (r.message as string[]).join(', ')
                : exception.message,
          ...(r.details !== undefined ? { details: r.details } : {}),
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} — ${exception.message}`,
        exception.stack,
      );
      const isProd = this.config.get<string>('api.nodeEnv', 'development') === 'production';
      body = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: AuthErrorCode.INTERNAL_ERROR,
        message: isProd ? 'An unexpected error occurred' : exception.message,
      };
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    } else {
      this.logger.error(`Unknown exception type at ${request.method} ${request.url}`);
    }

    response.status(status).json(body);
  }
}

function mapHttpStatusToCode(status: number): string {
  switch (status) {
    case 400:
      return AuthErrorCode.VALIDATION_FAILED;
    case 401:
      return AuthErrorCode.INVALID_CREDENTIALS;
    case 403:
      return AuthErrorCode.FORBIDDEN;
    case 404:
      return AuthErrorCode.USER_NOT_FOUND;
    case 429:
      return AuthErrorCode.RATE_LIMITED;
    default:
      return AuthErrorCode.INTERNAL_ERROR;
  }
}
