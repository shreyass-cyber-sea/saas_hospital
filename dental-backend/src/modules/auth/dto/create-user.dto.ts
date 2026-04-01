import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Role } from '../../../common/constants/roles.constant';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Supabase user id for the new account' })
  @IsString()
  @IsNotEmpty()
  supabaseUserId: string;

  @ApiProperty({ enum: Role, description: 'User role' })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description: 'Doctor profile (required if role is DOCTOR)',
  })
  @IsOptional()
  doctorProfile?: {
    specialization: string;
    registrationNumber: string;
  };
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
