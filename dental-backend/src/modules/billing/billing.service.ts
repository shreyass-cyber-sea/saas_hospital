import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaymentMode, InvoiceStatus, Prisma } from '@prisma/client';
import {
  CreateProcedureDto,
  UpdateProcedureDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
  CreateAdvanceDto,
} from './billing.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Procedures ──────────────────────────────────────────────────────────────
  async createProcedure(tenantId: string, dto: CreateProcedureDto) {
    return this.prisma.procedure.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        category: dto.category,
        defaultPrice: dto.defaultPrice ?? 0,
        defaultDuration: dto.defaultDuration ?? 30,
        taxable: dto.taxable ?? true,
        isActive: true,
      },
    });
  }

  async getProcedures(tenantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.procedure.findMany({
        where: { tenantId, isActive: true },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.procedure.count({ where: { tenantId, isActive: true } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProcedure(tenantId: string, id: string) {
    const procedure = await this.prisma.procedure.findUnique({
      where: { id },
    });
    if (!procedure || procedure.tenantId !== tenantId) {
      throw new NotFoundException('Procedure not found');
    }
    return procedure;
  }

  async updateProcedure(tenantId: string, id: string, dto: UpdateProcedureDto) {
    const procedure = await this.getProcedure(tenantId, id);
    return this.prisma.procedure.update({
      where: { id },
      data: {
        name: dto.name ?? procedure.name,
        code: dto.code ?? procedure.code,
        category: dto.category ?? procedure.category,
        defaultPrice: dto.defaultPrice ?? procedure.defaultPrice,
        defaultDuration: dto.defaultDuration ?? procedure.defaultDuration,
        taxable: dto.taxable ?? procedure.taxable,
        isActive: dto.isActive ?? procedure.isActive,
      },
    });
  }

  async deleteProcedure(tenantId: string, id: string) {
    await this.getProcedure(tenantId, id);
    return this.prisma.procedure.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────────
  async createInvoice(tenantId: string, userId: string, dto: CreateInvoiceDto) {
    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals from line items
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const lineItems = dto.lineItems.map((item) => {
      const qty = item.quantity ?? 1;
      const unitPrice = item.unitPrice ?? 0;
      const discountPercent = item.discountPercent ?? 0;
      const discount = item.discount ?? (qty * unitPrice * discountPercent) / 100;
      const taxableAmount = qty * unitPrice - discount;
      const taxPercent = item.taxPercent ?? 18;
      const taxAmount = (taxableAmount * taxPercent) / 100;
      const totalAmount = taxableAmount + taxAmount;

      subtotal += qty * unitPrice;
      totalDiscount += discount;
      totalTax += taxAmount;

      return {
        procedureId: item.procedureId ?? null,
        description: item.description,
        quantity: qty,
        unitPrice,
        discount,
        discountPercent,
        taxPercent,
        taxAmount,
        totalAmount,
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return this.prisma.invoice.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId ?? null,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        paidAmount: 0,
        pendingAmount: grandTotal,
        notes: dto.notes,
        createdByUserId: userId,
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        lineItems: {
          include: {
            procedure: true,
          },
        },
      },
    });
  }

  async getInvoices(
    tenantId: string,
    pagination: PaginationDto,
    filters?: { status?: string; patientId?: string; doctorId?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { tenantId };
    if (filters?.status) where.status = filters.status as InvoiceStatus;
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.doctorId) where.doctorId = filters.doctorId;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          patient: { select: { name: true, phone: true, patientId: true } },
          doctor: { select: { name: true, email: true } },
          appointment: { select: { date: true, startTime: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoice(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            procedure: true,
          },
        },
        payments: {
          include: {
            recordedByUser: { select: { name: true } },
          },
        },
        patient: { select: { name: true, phone: true, patientId: true, address: true } },
        doctor: { select: { name: true, email: true } },
        appointment: { select: { date: true, startTime: true } },
        createdByUser: { select: { name: true } },
      },
    });

    if (!invoice || invoice.tenantId !== tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    await this.getInvoice(tenantId, id);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status as InvoiceStatus }),
      },
    });
  }

  async cancelInvoice(tenantId: string, id: string, reason?: string) {
    const invoice = await this.getInvoice(tenantId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        notes: reason ? `${invoice.notes || ''}\n\nCancelled: ${reason}` : invoice.notes,
      },
    });
  }

  // ─── Payments ──────────────────────────────────────────────────────────────────
  async recordPayment(tenantId: string, userId: string, invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.getInvoice(tenantId, invoiceId);
    const paymentAmount = Math.min(dto.amount, invoice.pendingAmount);

    const payment = await this.prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: paymentAmount,
        mode: dto.mode ?? PaymentMode.CASH,
        reference: dto.reference,
        recordedByUserId: userId,
      },
    });

    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newPendingAmount = invoice.grandTotal - newPaidAmount;
    const newStatus =
      newPendingAmount <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
      },
    });

    return payment;
  }

  // ─── Advance Payments ─────────────────────────────────────────────────────────
  async createAdvancePayment(tenantId: string, dto: CreateAdvanceDto) {
    return this.prisma.advancePayment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        amount: dto.amount,
        balanceAmount: dto.amount,
        usedAmount: 0,
        mode: dto.mode ?? PaymentMode.CASH,
        notes: dto.notes,
      },
    });
  }

  async getAdvancePayments(tenantId: string, patientId?: string) {
    const where: Prisma.AdvancePaymentWhereInput = { tenantId };
    if (patientId) where.patientId = patientId;

    return this.prisma.advancePayment.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true, patientId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPatientAdvances(tenantId: string, patientId: string) {
    return this.prisma.advancePayment.findMany({
      where: { tenantId, patientId, balanceAmount: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });
  }
}