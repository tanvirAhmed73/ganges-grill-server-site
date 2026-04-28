import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  signToken(payload: Record<string, unknown>): { token: string } {
    const token = this.jwtService.sign(payload);
    return { token };
  }

  async checkAdminByEmail(
    requestedEmail: string,
    decoded: JwtPayload,
  ): Promise<{ isAdmin: boolean }> {
    const actorEmail = (decoded.userEmail ?? decoded.email ?? '') as string;
    if (!actorEmail || actorEmail !== requestedEmail) {
      throw new ForbiddenException({ message: 'unauthorized access' });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: requestedEmail },
      select: { role: true },
    });

    return { isAdmin: user?.role === 'admin' };
  }
}
