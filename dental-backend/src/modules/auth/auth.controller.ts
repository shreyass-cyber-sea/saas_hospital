import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new clinic (creates tenant + admin user)',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.registerTenant(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login/Sync profile after Supabase authentication' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('create-user')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin creates a new doctor/receptionist user' })
  createUser(@Request() req: any, @Body() dto: CreateUserDto) {
    return this.authService.createUser(req.tenantId, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: any) {
    // req.user is now the full user object from SupabaseStrategy.validate
    return this.authService.getMe(req.user.id);
  }
}
