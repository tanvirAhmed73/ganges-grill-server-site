import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const email = (request.user?.userEmail ?? request.user?.email ?? '') as string;

    if (!email) {
      throw new ForbiddenException({ message: 'forbidden access' });
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      throw new ForbiddenException({ message: 'forbidden access' });
    }

    return true;
  }
}
