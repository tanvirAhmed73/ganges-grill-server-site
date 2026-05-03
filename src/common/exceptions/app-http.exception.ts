import { HttpException, HttpStatus } from '@nestjs/common';
import type { AuthErrorCodeValue } from '../../modules/auth/constants/error-codes';

export type ErrorBody = {
  statusCode: number;
  code: AuthErrorCodeValue | string;
  message: string;
  details?: unknown;
};

export class AppHttpException extends HttpException {
  readonly errorCode: AuthErrorCodeValue | string;

  constructor(
    status: HttpStatus,
    code: AuthErrorCodeValue | string,
    message: string,
    details?: unknown,
  ) {
    const body: ErrorBody = {
      statusCode: status,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    };
    super(body, status);
    this.errorCode = code;
  }
}
