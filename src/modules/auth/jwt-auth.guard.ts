import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { AuthErrorCode } from './constants/error-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest<TUser>(
    err: Error | undefined,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    if (err || !user) {
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        AuthErrorCode.INVALID_CREDENTIALS,
        info?.message ?? err?.message ?? 'Invalid or missing access token.',
      );
    }
    return user;
  }
}
