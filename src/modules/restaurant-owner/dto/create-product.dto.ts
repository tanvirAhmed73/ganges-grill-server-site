import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateRestaurantProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  image!: string;

  @ApiProperty({ example: 'Mains' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  category!: string;

  @ApiProperty({ example: 12.99 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
