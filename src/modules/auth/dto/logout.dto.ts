import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token to revoke for this session. Omit only when using logout-all behavior elsewhere.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
