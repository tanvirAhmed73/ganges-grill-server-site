import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterRestaurantOwnerDto } from './dto/register-restaurant-owner.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtAccessPayload } from './interfaces/jwt-access-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @ApiOperation({ summary: 'Create account; verification email is queued (BullMQ).' })
  @ApiResponse({ status: 201 })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.name, dto.password);
  }

  @Post('register-restaurant-owner')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Create a vendor account (role restaurant_owner) and a linked restaurant row; same email OTP flow as register.',
  })
  async registerRestaurantOwner(@Body() dto: RegisterRestaurantOwnerDto) {
    return this.authService.registerRestaurantOwner(
      dto.email,
      dto.name,
      dto.password,
      dto.restaurantName,
      {
        primaryCategory: dto.primaryCategory,
        phone: dto.phone,
      },
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit OTP from email; returns access + refresh tokens.' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Resend OTP (same response whether email exists — avoids enumeration).',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Email + password; requires verified email.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token; returns new access + refresh pair.' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refresh(dto.refreshToken);
    return { tokens };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the given refresh token (current session).' })
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken, undefined);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the authenticated user.' })
  async logoutAll(@Req() req: Request & { user: JwtAccessPayload }) {
    return this.authService.logout(undefined, req.user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current user profile from access token.' })
  async me(@Req() req: Request & { user: JwtAccessPayload }) {
    const user = await this.authService.getProfile(req.user.sub);
    return { user };
  }

  @Get('admin/:email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Whether the given email is admin (must match token email). Legacy-compatible check.',
  })
  async adminEligibility(
    @Param('email') email: string,
    @Req() req: Request & { user: JwtAccessPayload },
  ) {
    return this.authService.checkAdminByEmail(email, req.user);
  }

  /** Introspection helper for UIs that store role client-side. */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'JWT claims useful for the frontend (sub, email, role).' })
  session(@Req() req: Request & { user: JwtAccessPayload }) {
    const u = req.user;
    return {
      sub: u.sub,
      email: u.email,
      role: u.role as UserRole,
    };
  }
}
