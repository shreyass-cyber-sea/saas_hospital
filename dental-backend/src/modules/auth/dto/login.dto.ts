import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@smiledental.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  password: string;
}
