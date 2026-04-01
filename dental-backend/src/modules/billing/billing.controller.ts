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
  Res,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto, RecordPaymentDto } from './billing.dto';
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
  getProcedures(@Request() req: any) {
    return this.billingService.getProcedures(req.tenantId);
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
    return this.billingService.createInvoice(req.tenantId, req.user.sub, dto);
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
      from,
      to,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get full invoice' })
  getInvoice(@Request() req: any, @Param('id') id: string) {
    return this.billingService.getInvoice(req.tenantId, id);
  }

  @Post('invoices/:id/issue')
  @ApiOperation({
    summary: 'Issue invoice (DRAFT → ISSUED) and trigger PDF generation',
  })
  issueInvoice(@Request() req: any, @Param('id') id: string) {
    return this.billingService.issueInvoice(req.tenantId, id);
  }

  @Post('invoices/:id/remind')
  @ApiOperation({ summary: 'Send email reminder for an invoice' })
  sendReminder(@Request() req: any, @Param('id') id: string) {
    return this.billingService.sendReminder(req.tenantId, id);
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
      id,
      req.user.sub,
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

  @Post('invoices/:id/refund')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Refund an invoice (sets status to REFUNDED)' })
  refundInvoice(
    @Request() req: any,
    @Param('id') id: string,
    @Query('reason') reason?: string,
  ) {
    return this.billingService.refundInvoice(req.tenantId, id, reason);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Update a draft invoice' })
  updateInvoice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.billingService.updateInvoice(req.tenantId, id, dto);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Get signed URL for invoice PDF' })
  getInvoicePdf(@Request() req: any, @Param('id') id: string) {
    return this.billingService.getInvoicePdf(req.tenantId, id);
  }

  @Get('invoices/:id/download')
  @ApiOperation({ summary: 'Download invoice PDF as binary attachment' })
  async downloadInvoicePdf(
    @Request() req: any,
    @Param('id') id: string,
    @Res() res: any,
  ) {
    try {
      const { buffer, filename } = await this.billingService.downloadInvoicePdf(
        req.tenantId,
        id,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      });
      res.status(200).send(buffer);
    } catch (error: any) {
      console.error('Download PDF Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate or download PDF', 
        error: error.message,
        stack: error.stack 
      });
    }
  }

  // ── Advance Payments ─────────────────────────────────────────────────────────
  @Post('advance-payments')
  @ApiOperation({ summary: 'Record advance payment from patient' })
  createAdvance(@Request() req: any, @Body() dto: any) {
    return this.billingService.createAdvancePayment(
      req.tenantId,
      req.user.sub,
      dto,
    );
  }

  @Get('advance-payments/patient/:patientId')
  @ApiOperation({ summary: 'Get advance balance for patient' })
  getAdvanceBalance(
    @Request() req: any,
    @Param('patientId') patientId: string,
  ) {
    return this.billingService.getAdvanceBalance(req.tenantId, patientId);
  }

  @Post('advance-payments/:id/use')
  @ApiOperation({ summary: 'Apply advance payment against an invoice' })
  useAdvance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { invoiceId: string; amount: number },
  ) {
    return this.billingService.useAdvance(
      req.tenantId,
      id,
      dto.invoiceId,
      dto.amount,
    );
  }
}
