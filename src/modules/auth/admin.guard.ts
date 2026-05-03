import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthErrorCode } from './constants/error-codes';
import { JwtAccessPayload } from './interfaces/jwt-access-payload.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtAccessPayload }>();
    const sub = request.user?.sub;

    if (!sub) {
      throw new AppHttpException(HttpStatus.FORBIDDEN, AuthErrorCode.FORBIDDEN, 'Forbidden.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      throw new AppHttpException(
        HttpStatus.FORBIDDEN,
        AuthErrorCode.FORBIDDEN,
        'Admin access required.',
      );
    }

    return true;
  }
}
