import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Smile Dental Clinic' })
  @IsString()
  clinicName: string;

  @ApiProperty({ example: 'Dr. John Doe', required: false })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiProperty({ example: '9999999999', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'admin@smiledental.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd!', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: 'uuid-from-supabase' })
  @IsString()
  @IsNotEmpty()
  supabaseUserId: string;
}
