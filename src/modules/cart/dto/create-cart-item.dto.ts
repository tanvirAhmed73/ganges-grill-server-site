import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsString()
  @IsNotEmpty()
  foodId!: string;

  /** Ignored when authenticated; profile email is used from the JWT. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  image!: string;

  @IsNumber()
  @Min(0)
  price!: number;
}
