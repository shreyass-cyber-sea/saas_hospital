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
import { InvoiceStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto, RecordPaymentDto, UpdateInvoiceDto, CreateAdvanceDto } from './billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ── Procedures ──────────────────────────────────────────────────────────────
  @Post('procedures')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add procedure to master list' })
  createProcedure(@Request() req: any, @Body() dto: any) {
    return this.billingService.createProcedure(req.tenantId, dto);
  }

  @Get('procedures')
  @ApiOperation({ summary: 'List all procedures for tenant' })
  getProcedures(@Request() req: any, @Query() pagination: PaginationDto) {
    return this.billingService.getProcedures(req.tenantId, pagination);
  }

  @Patch('procedures/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update procedure' })
  updateProcedure(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.billingService.updateProcedure(req.tenantId, id, dto);
  }

  @Delete('procedures/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate procedure' })
  deleteProcedure(@Request() req: any, @Param('id') id: string) {
    return this.billingService.deleteProcedure(req.tenantId, id);
  }

  // ── Invoices ────────────────────────────────────────────────────────────────
  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice (starts as DRAFT)' })
  createInvoice(@Request() req: any, @Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(req.tenantId, req.user.id, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices with filters and pagination' })
  getInvoices(
    @Request() req: any,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.billingService.getInvoices(req.tenantId, pagination, {
      status: status as InvoiceStatus,
      patientId,
      doctorId,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get full invoice' })
  getInvoice(@Request() req: any, @Param('id') id: string) {
    return this.billingService.getInvoice(req.tenantId, id);
  }

  @Post('invoices/:id/payment')
  @ApiOperation({ summary: 'Record a payment for invoice' })
  recordPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(
      req.tenantId,
      req.user.id,
      id,
      dto,
    );
  }

  @Post('invoices/:id/cancel')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cancel invoice' })
  cancelInvoice(
    @Request() req: any,
    @Param('id') id: string,
    @Query('reason') reason?: string,
  ) {
    return this.billingService.cancelInvoice(req.tenantId, id, reason);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Update a draft invoice' })
  updateInvoice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.billingService.updateInvoice(req.tenantId, id, dto);
  }

  // ── Advance Payments ─────────────────────────────────────────────────────────
  @Post('advance-payments')
  @ApiOperation({ summary: 'Record advance payment from patient' })
  createAdvance(@Request() req: any, @Body() dto: CreateAdvanceDto) {
    return this.billingService.createAdvancePayment(req.tenantId, dto);
  }

  @Get('advance-payments/patient/:patientId')
  @ApiOperation({ summary: 'Get advance entries with available balance for patient' })
  getPatientAdvances(
    @Request() req: any,
    @Param('patientId') patientId: string,
  ) {
    return this.billingService.getPatientAdvances(req.tenantId, patientId);
  }
}
