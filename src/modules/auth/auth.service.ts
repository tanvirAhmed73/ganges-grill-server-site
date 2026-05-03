import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { MailQueueService } from '../mail/mail-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthErrorCode } from './constants/error-codes';
import {
  generateRefreshTokenRaw,
  hashEmailOtp,
  hashRefreshToken,
  verifyEmailOtp,
} from './crypto/tokens';
import { JwtAccessPayload } from './interfaces/jwt-access-payload.interface';

const OTP_TTL_MS = 15 * 60 * 1000;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

export type UserPublic = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailQueue: MailQueueService,
  ) {}

  private get otpPepper(): string {
    return (
      this.config.get<string>('jwt.otpPepper', '') ||
      this.config.get<string>('jwt.accessSecret', '') ||
      ''
    );
  }

  private get accessExpiresSeconds(): number {
    const sec = this.config.get<number>('jwt.accessExpiresSec', 900);
    return Number.isFinite(sec) && sec > 0 ? sec : 900;
  }

  private get refreshExpiresMs(): number {
    const days = this.config.get<number>('jwt.refreshExpiresDays', 7);
    return Math.max(1, days) * 24 * 60 * 60 * 1000;
  }

  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<{ message: string; user: UserPublic }> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      throw new AppHttpException(
        HttpStatus.CONFLICT,
        AuthErrorCode.EMAIL_ALREADY_REGISTERED,
        'An account with this email already exists.',
      );
    }

    const passwordHash = await argon2.hash(password);
    const code = this.generateOtpDigits();
    const codeHash = hashEmailOtp(normalized, code, this.requirePepper());

    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        name: name.trim(),
        passwordHash,
        emailVerifiedAt: null,
        verificationCodeHash: codeHash,
        verificationExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.enqueueVerificationMail(user.email, user.name, code);

    return {
      message:
        'Registration successful. Check your email for a verification code to activate your account.',
      user: this.toPublicUser(user),
    };
  }

  async verifyEmail(email: string, code: string): Promise<{ message: string; tokens: TokenPair }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      throw new AppHttpException(
        HttpStatus.BAD_REQUEST,
        AuthErrorCode.INVALID_OR_EXPIRED_OTP,
        'Invalid or expired verification code.',
      );
    }

    if (user.emailVerifiedAt) {
      throw new AppHttpException(
        HttpStatus.BAD_REQUEST,
        AuthErrorCode.VALIDATION_FAILED,
        'Email is already verified.',
      );
    }

    if (
      !user.verificationCodeHash ||
      !user.verificationExpiresAt ||
      user.verificationExpiresAt < new Date()
    ) {
      throw new AppHttpException(
        HttpStatus.BAD_REQUEST,
        AuthErrorCode.INVALID_OR_EXPIRED_OTP,
        'Invalid or expired verification code.',
      );
    }

    const ok = verifyEmailOtp(normalized, code, this.requirePepper(), user.verificationCodeHash);
    if (!ok) {
      throw new AppHttpException(
        HttpStatus.BAD_REQUEST,
        AuthErrorCode.INVALID_OR_EXPIRED_OTP,
        'Invalid or expired verification code.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verificationCodeHash: null,
        verificationExpiresAt: null,
      },
    });

    const tokens = await this.issueTokenPair(updated);
    return {
      message: 'Email verified successfully.',
      tokens,
    };
  }

  /** Always responds success-style to avoid email enumeration. */
  async resendVerification(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user || user.emailVerifiedAt) {
      return {
        message: 'If an account exists for this email and is awaiting verification, a new code has been sent.',
      };
    }

    const code = this.generateOtpDigits();
    const codeHash = hashEmailOtp(normalized, code, this.requirePepper());

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCodeHash: codeHash,
        verificationExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.enqueueVerificationMail(user.email, user.name, code);

    return {
      message: 'If an account exists for this email and is awaiting verification, a new code has been sent.',
    };
  }

  async login(email: string, password: string): Promise<{ user: UserPublic; tokens: TokenPair }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user?.passwordHash) {
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password.',
      );
    }

    const match = await argon2.verify(user.passwordHash, password);
    if (!match) {
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password.',
      );
    }

    if (!user.emailVerifiedAt) {
      throw new AppHttpException(
        HttpStatus.FORBIDDEN,
        AuthErrorCode.EMAIL_NOT_VERIFIED,
        'Please verify your email before signing in. Check your inbox or request a new code.',
      );
    }

    const tokens = await this.issueTokenPair(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async refresh(refreshTokenRaw: string): Promise<TokenPair> {
    const hash = hashRefreshToken(refreshTokenRaw);
    const row = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash: hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!row?.user.emailVerifiedAt) {
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        AuthErrorCode.INVALID_REFRESH_TOKEN,
        'Invalid or expired refresh token.',
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(row.user);
  }

  async logout(refreshTokenRaw: string | undefined, userId?: string): Promise<{ message: string }> {
    if (refreshTokenRaw) {
      const hash = hashRefreshToken(refreshTokenRaw);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { message: 'Session ended.' };
    }

    if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { message: 'All sessions ended.' };
    }

    throw new AppHttpException(
      HttpStatus.BAD_REQUEST,
      AuthErrorCode.VALIDATION_FAILED,
      'Provide refreshToken in the body, or call logout-all with a Bearer access token.',
    );
  }

  async getProfile(userId: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppHttpException(
        HttpStatus.NOT_FOUND,
        AuthErrorCode.USER_NOT_FOUND,
        'User not found.',
      );
    }
    return this.toPublicUser(user);
  }

  async checkAdminByEmail(
    requestedEmail: string,
    actor: JwtAccessPayload,
  ): Promise<{ isAdmin: boolean }> {
    const normalized = requestedEmail.trim().toLowerCase();
    if (actor.email.toLowerCase() !== normalized) {
      throw new AppHttpException(
        HttpStatus.FORBIDDEN,
        AuthErrorCode.FORBIDDEN,
        'You can only check admin status for your own email.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { role: true },
    });

    return { isAdmin: user?.role === UserRole.admin };
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const payload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const rawRefresh = generateRefreshTokenRaw();
    const tokenHash = hashRefreshToken(rawRefresh);
    const expiresAt = new Date(Date.now() + this.refreshExpiresMs);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      expiresIn: this.accessExpiresSeconds,
      tokenType: 'Bearer',
    };
  }

  private toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateOtpDigits(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private requirePepper(): string {
    const p = this.otpPepper;
    if (!p) {
      throw new AppHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        AuthErrorCode.INTERNAL_ERROR,
        'Server misconfiguration: set OTP_PEPPER or JWT_ACCESS_SECRET.',
      );
    }
    return p;
  }

  private async enqueueVerificationMail(to: string, name: string, code: string): Promise<void> {
    await this.mailQueue.queueVerificationEmail(to, name, code);
  }
}
