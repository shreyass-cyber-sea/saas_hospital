import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  InventoryItem,
  StockTransaction,
  TransactionType,
  LabCase,
  Prisma,
} from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export interface CreateTransactionDto {
  itemId: string;
  type: TransactionType;
  quantity: number;
  unitCost?: number;
  referenceNote?: string;
  patientId?: string;
}

export type InventoryItemWithTenant = InventoryItem;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Items ─────────────────────────────────────────────────────────────────
  async createItem(tenantId: string, dto: Partial<InventoryItem>): Promise<InventoryItemWithTenant> {
    return this.prisma.inventoryItem.create({
      data: {
        tenantId,
        name: dto.name as string,
        sku: dto.sku,
        category: dto.category,
        description: dto.description,
        unit: dto.unit ?? 'piece',
        currentStock: dto.currentStock ?? 0,
        minimumStock: dto.minimumStock ?? 0,
        unitCost: dto.unitCost ?? 0,
        sellingPrice: dto.sellingPrice ?? 0,
        supplier: dto.supplier,
        supplierPhone: dto.supplierPhone,
        location: dto.location,
        expiryDate: dto.expiryDate,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getItems(
    tenantId: string,
    pagination: PaginationDto,
    filters: { category?: string; lowStock?: boolean },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
      isActive: true,
    };
    if (filters.category) where.category = { contains: filters.category, mode: 'insensitive' };
    if (filters.lowStock) {
      where.currentStock = { lte: this.prisma.inventoryItem.fields.minimumStock as any };
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getItem(tenantId: string, id: string): Promise<InventoryItemWithTenant> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async updateItem(
    tenantId: string,
    id: string,
    dto: Partial<InventoryItem>,
  ): Promise<InventoryItemWithTenant> {
    const item = await this.getItem(tenantId, id);
    const { currentStock, minimumStock, unitCost, sellingPrice, ...updateData } = dto;
    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...updateData,
        currentStock: currentStock ?? item.currentStock,
        minimumStock: minimumStock ?? item.minimumStock,
        unitCost: unitCost ?? item.unitCost,
        sellingPrice: sellingPrice ?? item.sellingPrice,
      },
    });
  }

  async getLowStockItems(tenantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        isActive: true,
        currentStock: { lte: this.prisma.inventoryItem.fields.minimumStock as any },
      },
    });
  }

  async getInventoryValuation(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, isActive: true },
      select: {
        category: true,
        currentStock: true,
        unitCost: true,
      },
    });

    const grouped: Record<string, { totalValue: number; itemCount: number; totalUnits: number }> = {};
    for (const item of items) {
      const cat = item.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = { totalValue: 0, itemCount: 0, totalUnits: 0 };
      grouped[cat].totalValue += item.currentStock * item.unitCost;
      grouped[cat].itemCount += 1;
      grouped[cat].totalUnits += item.currentStock;
    }

    return Object.entries(grouped)
      .map(([category, vals]) => ({ category, ...vals }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }

  // ─── Transactions ───────────────────────────────────────────────────────────
  async createTransaction(
    tenantId: string,
    userId: string,
    dto: CreateTransactionDto,
  ) {
    const item = await this.getItem(tenantId, dto.itemId);

    // Adjust stock
    const stockDelta =
      dto.type === TransactionType.PURCHASE || dto.type === TransactionType.RETURN
        ? dto.quantity
        : -Math.abs(dto.quantity);

    const newStock = parseFloat((item.currentStock + stockDelta).toFixed(2));
    const unitCost = dto.unitCost ?? item.unitCost;
    const totalCost = unitCost * Math.abs(dto.quantity);

    const result = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: dto.itemId },
        data: { currentStock: newStock },
      }),
      this.prisma.stockTransaction.create({
        data: {
          tenantId,
          itemId: dto.itemId,
          type: dto.type,
          quantity: stockDelta,
          unitCost,
          totalCost: parseFloat(totalCost.toFixed(2)),
          referenceNote: dto.referenceNote,
          patientId: dto.patientId || null,
          performedById: userId,
        },
      }),
    ]);

    const [updatedItem, tx] = result;
    const isLowStock = newStock <= item.minimumStock;

    if (isLowStock) {
      this.logger.warn(
        `LOW STOCK ALERT: ${item.name} — ${newStock} ${item.unit} remaining`,
      );
    }

    return { transaction: tx, item: updatedItem, isLowStock };
  }

  async getTransactions(
    tenantId: string,
    pagination: PaginationDto,
    filters: { itemId?: string; type?: string; from?: string; to?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.StockTransactionWhereInput = {
      tenantId,
    };
    if (filters.itemId) where.itemId = filters.itemId;
    if (filters.type) where.type = filters.type as TransactionType;
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to + 'T23:59:59') } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.stockTransaction.findMany({
        where,
        include: {
          item: { select: { name: true, unit: true, category: true } },
          performedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockTransaction.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Lab Cases ─────────────────────────────────────────────────────────────
  async createLabCase(tenantId: string, dto: Partial<LabCase>): Promise<LabCase> {
    return this.prisma.labCase.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId as string,
        caseType: dto.caseType as string,
        description: dto.description,
        shade: dto.shade,
        labName: dto.labName,
        sentDate: dto.sentDate ?? new Date(),
        expectedDate: dto.expectedDate,
        deliveredDate: dto.deliveredDate,
        status: dto.status ?? 'SENT',
        cost: dto.cost ?? 0,
        notes: dto.notes,
      },
    });
  }

  async getLabCases(
    tenantId: string,
    filters: { status?: string; doctorId?: string },
  ) {
    const where: Prisma.LabCaseWhereInput = { tenantId };
    if (filters.status) where.status = { contains: filters.status, mode: 'insensitive' };
    if (filters.doctorId) where.doctorId = filters.doctorId;

    return this.prisma.labCase.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true, patientId: true } },
        doctor: { select: { name: true, email: true } },
      },
      orderBy: { sentDate: 'desc' },
    });
  }

  async updateLabCase(tenantId: string, id: string, dto: Partial<LabCase>): Promise<LabCase> {
    const labCase = await this.prisma.labCase.findUnique({ where: { id } });
    if (!labCase || labCase.tenantId !== tenantId) {
      throw new NotFoundException('Lab case not found');
    }
    return this.prisma.labCase.update({
      where: { id },
      data: {
        ...dto,
        patientId: (dto as any).patientId ?? labCase.patientId,
        doctorId: (dto as any).doctorId ?? labCase.doctorId,
      },
    });
  }

  async getPendingLabCases(tenantId: string): Promise<LabCase[]> {
    return this.prisma.labCase.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'IN_PROGRESS'] },
      },
      include: {
        patient: { select: { name: true, phone: true, patientId: true } },
        doctor: { select: { name: true, email: true } },
      },
    });
  }
}