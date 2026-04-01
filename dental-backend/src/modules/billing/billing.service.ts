import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  Invoice, 
  InvoiceStatus, 
  PaymentMode, 
  Procedure, 
  AdvancePayment,
  Role
} from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { PdfService } from './pdf.service';
import { EmailService } from '../notifications/email.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';
import {
  CreateInvoiceDto,
  RecordPaymentDto,
  LineItemDto as LineItemInput,
} from './billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  private getClinicInfo() {
    return {
      clinicName: this.configService.get<string>('CLINIC_NAME', 'Dental Clinic'),
      clinicAddress: this.configService.get<string>('CLINIC_ADDRESS', ''),
      clinicPhone: this.configService.get<string>('CLINIC_PHONE', ''),
      clinicGstin: this.configService.get<string>('CLINIC_GSTIN'),
    };
  }

  // ─── Invoice Number Generation ─────────────────────────────────────────────
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { tenantId },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `INV-${year}-${seq}`;
  }

  // ─── Amount Calculation ─────────────────────────────────────────────────────
  private calculateLineItems(lineItems: LineItemInput[]) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const calculated = lineItems.map((item) => {
      const qty = item.quantity || 1;
      const unitPrice = item.unitPrice;
      const discountAmount =
        item.discount ??
        (item.discountPercent
          ? (unitPrice * qty * item.discountPercent) / 100
          : 0);
      const taxPercent = item.taxPercent ?? 18;
      const taxableAmount = unitPrice * qty - discountAmount;
      const taxAmount = parseFloat(
        ((taxableAmount * taxPercent) / 100).toFixed(2),
      );
      const totalAmount = parseFloat((taxableAmount + taxAmount).toFixed(2));

      subtotal += unitPrice * qty;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        procedureId: item.procedureId || null,
        description: item.description,
        quantity: qty,
        unitPrice,
        discount: parseFloat(discountAmount.toFixed(2)),
        discountPercent: item.discountPercent ?? 0,
        taxPercent,
        taxAmount,
        totalAmount,
      };
    });

    const grandTotal = parseFloat(
      (subtotal - totalDiscount + totalTax).toFixed(2),
    );
    return {
      items: calculated,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      grandTotal,
    };
  }

  // ─── Procedures ─────────────────────────────────────────────────────────────
  async createProcedure(
    tenantId: string,
    dto: Partial<Procedure>,
  ): Promise<Procedure> {
    return this.prisma.procedure.create({
      data: {
        ...(dto as any),
        tenantId,
      },
    });
  }

  async getProcedures(tenantId: string) {
    return this.prisma.procedure.findMany({
      where: { tenantId, isActive: true },
    });
  }

  async updateProcedure(
    tenantId: string,
    id: string,
    dto: Partial<Procedure>,
  ): Promise<Procedure> {
    try {
      return await this.prisma.procedure.update({
        where: { id },
        data: dto as any,
      });
    } catch (error) {
      throw new NotFoundException('Procedure not found');
    }
  }

  async deleteProcedure(tenantId: string, id: string): Promise<void> {
    await this.prisma.procedure.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Invoices ───────────────────────────────────────────────────────────────
  async createInvoice(
    tenantId: string,
    userId: string,
    dto: CreateInvoiceDto,
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const { items, subtotal, totalDiscount, totalTax, grandTotal } =
      this.calculateLineItems(dto.lineItems);
    const advanceUsed = dto.advanceUsed ?? 0;
    const paidAmount = advanceUsed;
    const pendingAmount = parseFloat((grandTotal - paidAmount).toFixed(2));

    return this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId || null,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        paidAmount,
        pendingAmount,
        advanceUsed,
        notes: dto.notes,
        createdByUserId: userId,
        lineItems: {
          create: items,
        },
      },
      include: {
        lineItems: true,
      },
    });
  }

  async getInvoices(
    tenantId: string,
    pagination: PaginationDto,
    filters: {
      status?: InvoiceStatus;
      patientId?: string;
      doctorId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to + 'T23:59:59') } : {}),
      };
    }

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          patient: { select: { name: true, phone: true, patientId: true } },
          doctor: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoice(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { name: true, phone: true, patientId: true } },
        doctor: { select: { name: true, email: true } },
        lineItems: {
          include: { procedure: { select: { name: true, code: true } } },
        },
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async issueInvoice(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.ISSUED },
      include: {
        patient: { select: { name: true, phone: true, email: true, patientId: true } },
        doctor: { select: { name: true } },
        lineItems: true,
        payments: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const patient = invoice.patient as any;

    this.generateAndSavePdf(tenantId, invoice as any).then((pdfUrl) => {
      this.emailService.sendInvoiceEmail({
        patientName: patient?.name ?? '',
        patientEmail: patient?.email ?? '',
        clinicName: this.getClinicInfo().clinicName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
        grandTotal: invoice.grandTotal,
        pdfUrl,
        lineItems: (invoice as any).lineItems,
      }).catch(err => this.logger.error(`Failed to send invoice email: ${err.message}`));
    }).catch((err) =>
      this.logger.error(`PDF generation failed for ${id}: ${err.message}`),
    );

    return invoice;
  }

  async sendReminder(tenantId: string, id: string) {
    const invoice = await this.getInvoice(tenantId, id);
    const patient = (invoice as any).patient;
    if (!patient?.email) throw new BadRequestException('Patient has no email');

    let pdfUrl = invoice.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = await this.generateAndSavePdf(tenantId, invoice as any);
    }

    await this.emailService.sendInvoiceEmail({
      patientName: patient.name,
      patientEmail: patient.email,
      clinicName: this.getClinicInfo().clinicName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
      grandTotal: invoice.grandTotal,
      pdfUrl: pdfUrl as string,
      lineItems: (invoice as any).lineItems || [],
    });

    return { success: true, message: 'Reminder sent' };
  }

  private async generateAndSavePdf(tenantId: string, invoice: any) {
    const patient = invoice.patient;
    const clinic = this.getClinicInfo();
    const pdfBuffer = await this.pdfService.generateInvoice({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
      clinicName: clinic.clinicName,
      clinicAddress: clinic.clinicAddress,
      clinicPhone: clinic.clinicPhone,
      clinicGstin: clinic.clinicGstin,
      patientName: patient?.name ?? '',
      patientId: patient?.patientId ?? '',
      patientPhone: patient?.phone ?? '',
      lineItems: invoice.lineItems || [],
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      grandTotal: invoice.grandTotal,
      paidAmount: invoice.paidAmount,
      pendingAmount: invoice.pendingAmount,
      payments: (invoice.payments || []).map((p: any) => ({
        amount: p.amount,
        mode: p.mode,
        paidAt: new Date(p.paidAt).toLocaleDateString('en-IN'),
      })),
    });

    const pdfUrl = await this.storageService.uploadInvoicePDF(
      tenantId,
      invoice.id,
      pdfBuffer,
    );

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });
    return pdfUrl;
  }

  async recordPayment(
    tenantId: string,
    id: string,
    userId: string,
    dto: RecordPaymentDto,
  ): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const newPaidAmount = parseFloat((invoice.paidAmount + dto.amount).toFixed(2));
    const newPendingAmount = parseFloat((invoice.grandTotal - newPaidAmount).toFixed(2));

    let newStatus = invoice.status;
    if (newPendingAmount <= 0) newStatus = InvoiceStatus.PAID;
    else if (newPaidAmount > 0) newStatus = InvoiceStatus.PARTIALLY_PAID;

    return this.prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: Math.max(0, newPendingAmount),
        status: newStatus,
        payments: {
          create: {
            amount: dto.amount,
            mode: dto.mode as PaymentMode,
            reference: dto.reference,
            recordedByUserId: userId,
          },
        },
      },
      include: {
        payments: true,
      },
    });
  }

  async cancelInvoice(tenantId: string, id: string, reason?: string): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED, notes: reason },
    });
  }

  async getInvoicePdf(tenantId: string, id: string): Promise<string> {
    const invoice = await this.getInvoice(tenantId, id);
    if (invoice.pdfUrl) {
      const filePath = invoice.pdfUrl.split(`storage.googleapis.com/`)[1];
      return this.storageService.getSignedUrl(filePath.split('/').slice(1).join('/'));
    }
    return await this.generateAndSavePdf(tenantId, invoice);
  }

  async downloadInvoicePdf(tenantId: string, id: string) {
    const invoice = await this.getInvoice(tenantId, id);
    const buffer = await this.pdfService.generateInvoice({
      ...this.getClinicInfo(),
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
      patientName: (invoice as any).patient?.name || 'Patient',
      patientId: (invoice as any).patient?.patientId || id,
      patientPhone: (invoice as any).patient?.phone || '',
      lineItems: (invoice as any).lineItems || [],
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      grandTotal: invoice.grandTotal,
      paidAmount: invoice.paidAmount,
      pendingAmount: invoice.pendingAmount,
      payments: (invoice as any).payments.map((p: any) => ({
        amount: p.amount,
        mode: p.mode,
        paidAt: new Date(p.paidAt).toLocaleDateString('en-IN'),
      })),
    });

    return { buffer, filename: `invoice-${invoice.invoiceNumber}.pdf` };
  }

  // ─── Advance Payments ──────────────────────────────────────────────────────
  async createAdvancePayment(
    tenantId: string,
    userId: string,
    dto: {
      patientId: string;
      amount: number;
      mode: PaymentMode;
      reference?: string;
      notes?: string;
    },
  ): Promise<AdvancePayment> {
    return this.prisma.advancePayment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        amount: dto.amount,
        balanceAmount: dto.amount,
        notes: dto.notes,
        mode: dto.mode,
      },
    });
  }

  async getAdvanceBalance(tenantId: string, patientId: string) {
    return this.prisma.advancePayment.findMany({
      where: { tenantId, patientId },
    });
  }

  async useAdvance(
    tenantId: string,
    advanceId: string,
    invoiceId: string,
    amount: number,
  ): Promise<void> {
    const advance = await this.prisma.advancePayment.findFirst({
      where: { id: advanceId, tenantId },
    });
    if (!advance) throw new NotFoundException('Advance payment not found');
    if (advance.balanceAmount < amount)
      throw new BadRequestException('Insufficient advance balance');

    await this.prisma.$transaction([
      this.prisma.advancePayment.update({
        where: { id: advanceId },
        data: {
          balanceAmount: { decrement: amount },
          usedAmount: { increment: amount },
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          advanceUsed: { increment: amount },
          paidAmount: { increment: amount },
          pendingAmount: { decrement: amount },
        },
      }),
    ]);
  }

  async refundInvoice(tenantId: string, id: string, reason?: string): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.REFUNDED, notes: reason },
    });
  }

  async updateInvoice(
    tenantId: string,
    id: string,
    dto: CreateInvoiceDto,
  ): Promise<Invoice> {
    const { items, subtotal, totalDiscount, totalTax, grandTotal } =
      this.calculateLineItems(dto.lineItems);
    
    // For simplicity in this migration, we delete old items and recreate new ones
    await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    return this.prisma.invoice.update({
      where: { id },
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId || null,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        notes: dto.notes,
        pdfUrl: null,
        lineItems: {
          create: items,
        },
      },
    });
  }
}
