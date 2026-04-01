import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DOCTOR)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard summary widget data' })
  getDashboard(@Request() req: any) {
    return this.reportsService.getDashboard(req.tenantId);
  }

  @Get('revenue/daily')
  @ApiOperation({
    summary: 'Daily revenue for date range (default: last 30 days)',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenueDaily(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getRevenueDaily(req.tenantId, from, to);
  }

  @Get('revenue/monthly')
  @ApiOperation({ summary: 'Monthly revenue grouped by month/year' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenueMonthly(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getRevenueMonthly(req.tenantId, from, to);
  }

  @Get('revenue/doctor')
  @ApiOperation({ summary: 'Revenue grouped by doctor' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenueByDoctor(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getRevenueByDoctor(req.tenantId, from, to);
  }

  @Get('appointments/summary')
  @ApiOperation({ summary: 'Appointment counts by status breakdown' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getAppointmentsSummary(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getAppointmentsSummary(req.tenantId, from, to);
  }

  @Get('appointments/no-show')
  @ApiOperation({ summary: 'No-show appointments list for follow-up' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getNoShow(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getNoShowAppointments(req.tenantId, from, to);
  }

  @Get('patients/growth')
  @ApiOperation({ summary: 'New patient registrations per month' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getPatientGrowth(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getPatientGrowth(req.tenantId, from, to);
  }

  @Get('patients/pending-payments')
  @ApiOperation({ summary: 'Patients with outstanding invoice balances' })
  getPendingPayments(@Request() req: any) {
    return this.reportsService.getPendingPayments(req.tenantId);
  }

  @Get('inventory/expenses')
  @ApiOperation({ summary: 'Inventory purchase expenses grouped by category' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getInventoryExpenses(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getInventoryExpenses(req.tenantId, from, to);
  }

  @Get('chairs/utilization')
  @ApiOperation({ summary: 'Chair utilization (completed appointments)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getChairUtilization(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getChairUtilization(req.tenantId, from, to);
  }
}
