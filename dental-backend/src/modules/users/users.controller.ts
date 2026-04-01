import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors for the tenant' })
  getDoctors(@Request() req: any) {
    return this.usersService.findDoctorsByTenant(req.tenantId);
  }
}
