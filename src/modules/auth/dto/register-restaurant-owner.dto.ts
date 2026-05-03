import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterRestaurantOwnerDto {
  @ApiProperty({ example: 'chef@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'Jamil Ahmed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    description: 'Min 8 chars, at least one uppercase, one lowercase, one digit',
    example: 'Str0ngPass',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must include at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @ApiProperty({ example: 'Ma Biryani — Banani' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  restaurantName!: string;

  @ApiPropertyOptional({
    example: 'Biryani, Bangladeshi',
    description: 'Shown on listings (defaults to "Restaurant").',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  primaryCategory?: string;

  @ApiPropertyOptional({ example: '+880 1XXX-XXXXXX' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
