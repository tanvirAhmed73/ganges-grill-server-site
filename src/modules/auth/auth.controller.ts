import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './jwt-payload.type';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('jwt')
  postJwt(@Body() body: Record<string, unknown>): { token: string } {
    return this.authService.signToken(body);
  }

  /** Same token response as `POST /jwt` (original API used `POST /user` for this). */
  @Post('user')
  postTokenForUserPath(@Body() body: Record<string, unknown>): { token: string } {
    return this.authService.signToken(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/admin/:email')
  isAdmin(
    @Param('email') email: string,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<{ isAdmin: boolean }> {
    return this.authService.checkAdminByEmail(email, req.user);
  }
}
