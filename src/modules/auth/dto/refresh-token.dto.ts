import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque refresh token returned by login / refresh / verify-email' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
