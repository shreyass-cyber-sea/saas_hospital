import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateStatusDto,
  CreateDoctorLeaveDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create appointment' })
  create(@Request() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.tenantId, req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments with filters and pagination' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(
    @Request() req: any,
    @Query() pagination: PaginationDto,
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.appointmentsService.findAll(req.tenantId, pagination, {
      date,
      doctorId,
      status: status as AppointmentStatus,
      patientId,
    });
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's appointments grouped by doctor" })
  getToday(@Request() req: any) {
    return this.appointmentsService.getTodayAppointments(req.tenantId);
  }

  @Get('for-calendar')
  @ApiOperation({ summary: 'Get appointments for calendar view (date range)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getForCalendar(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.getAppointmentsForDateRange(
      req.tenantId,
      startDate,
      endDate,
    );
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor on a date' })
  @ApiQuery({ name: 'doctorId', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'duration', required: false })
  getSlots(
    @Request() req: any,
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('duration') duration?: number,
  ) {
    return this.appointmentsService.getAvailableSlots(
      req.tenantId,
      doctorId,
      date,
      duration,
    );
  }

  @Get('doctor-leave')
  @ApiOperation({ summary: 'List doctor leave/blocked dates' })
  @ApiQuery({ name: 'doctorId', required: false })
  getDoctorLeaves(@Request() req: any, @Query('doctorId') doctorId?: string) {
    return this.appointmentsService.getDoctorLeaves(req.tenantId, doctorId);
  }

  @Post('doctor-leave')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Block a doctor for a date' })
  createDoctorLeave(@Request() req: any, @Body() dto: CreateDoctorLeaveDto) {
    return this.appointmentsService.createDoctorLeave(req.tenantId, dto);
  }

  @Delete('doctor-leave/:id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Unblock a doctor leave entry' })
  deleteDoctorLeave(@Request() req: any, @Param('id') id: string) {
    return this.appointmentsService.deleteDoctorLeave(req.tenantId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single appointment' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.appointmentsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment (notes, chair, procedures)' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(req.tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatus(req.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel appointment (soft delete)' })
  cancel(
    @Request() req: any,
    @Param('id') id: string,
    @Query('reason') reason?: string,
  ) {
    return this.appointmentsService.cancel(req.tenantId, id, reason);
  }
}
