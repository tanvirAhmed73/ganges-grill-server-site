import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { AuthErrorCode } from '../auth/constants/error-codes';
import { JwtAccessPayload } from '../auth/interfaces/jwt-access-payload.interface';

@Injectable()
export class RestaurantOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtAccessPayload }>();
    if (request.user?.role !== UserRole.restaurant_owner) {
      throw new AppHttpException(
        HttpStatus.FORBIDDEN,
        AuthErrorCode.FORBIDDEN,
        'Restaurant owner account required.',
      );
    }
    return true;
  }
}
