import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InventoryItem,
  InventoryItemDocument,
  StockTransaction,
  StockTransactionDocument,
  TransactionType,
  LabCase,
  LabCaseDocument,
} from './inventory.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(InventoryItem.name)
    private itemModel: Model<InventoryItemDocument>,
    @InjectModel(StockTransaction.name)
    private txModel: Model<StockTransactionDocument>,
    @InjectModel(LabCase.name) private labCaseModel: Model<LabCaseDocument>,
  ) {}

  // ─── Items ─────────────────────────────────────────────────────────────────
  async createItem(
    tenantId: string,
    dto: Partial<InventoryItem>,
  ): Promise<InventoryItemDocument> {
    const item = new this.itemModel({
      ...dto,
      tenantId: new Types.ObjectId(tenantId),
    });
    return item.save();
  }

  async getItems(
    tenantId: string,
    pagination: PaginationDto,
    filters: { category?: string; lowStock?: boolean },
  ) {
    const query: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    };
    if (filters.category) query.category = filters.category;
    if (filters.lowStock)
      query.$expr = { $lte: ['$currentStock', '$minimumStock'] };

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.itemModel
        .find(query as any)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      this.itemModel.countDocuments(query as any),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getItem(tenantId: string, id: string): Promise<InventoryItemDocument> {
    const item = await this.itemModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    } as any);
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async updateItem(
    tenantId: string,
    id: string,
    dto: Partial<InventoryItem>,
  ): Promise<InventoryItemDocument> {
    const item = await this.itemModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      } as any,
      { $set: dto },
      { new: true },
    );
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async getLowStockItems(tenantId: string) {
    return this.itemModel.find({
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
    } as any);
  }

  async getInventoryValuation(tenantId: string) {
    return this.itemModel.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), isActive: true } },
      {
        $group: {
          _id: '$category',
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } },
          itemCount: { $sum: 1 },
          totalUnits: { $sum: '$currentStock' },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);
  }

  // ─── Transactions ───────────────────────────────────────────────────────────
  async createTransaction(
    tenantId: string,
    userId: string,
    dto: {
      itemId: string;
      type: TransactionType;
      quantity: number;
      unitCost?: number;
      referenceNote?: string;
      patientId?: string;
    },
  ) {
    const item = await this.getItem(tenantId, dto.itemId);

    // Adjust stock
    const stockDelta =
      dto.type === TransactionType.PURCHASE ||
      dto.type === TransactionType.RETURN
        ? dto.quantity
        : -Math.abs(dto.quantity);

    item.currentStock = parseFloat((item.currentStock + stockDelta).toFixed(2));
    await item.save();

    const totalCost = (dto.unitCost ?? item.unitCost) * Math.abs(dto.quantity);
    const tx = new this.txModel({
      tenantId: new Types.ObjectId(tenantId),
      itemId: new Types.ObjectId(dto.itemId),
      type: dto.type,
      quantity: stockDelta,
      unitCost: dto.unitCost ?? item.unitCost,
      totalCost: parseFloat(totalCost.toFixed(2)),
      referenceNote: dto.referenceNote,
      ...(dto.patientId && { patientId: new Types.ObjectId(dto.patientId) }),
      performedBy: new Types.ObjectId(userId),
    });

    const saved = await tx.save();

    // Low stock alert
    const isLowStock = item.currentStock <= item.minimumStock;
    if (isLowStock) {
      this.logger.warn(
        `LOW STOCK ALERT: ${item.name} (tenantId: ${tenantId}) — ${item.currentStock} ${item.unit} remaining`,
      );
    }

    return { transaction: saved, item, isLowStock };
  }

  async getTransactions(
    tenantId: string,
    pagination: PaginationDto,
    filters: { itemId?: string; type?: string; from?: string; to?: string },
  ) {
    const query: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (filters.itemId) query.itemId = new Types.ObjectId(filters.itemId);
    if (filters.type) query.type = filters.type;
    if (filters.from || filters.to) {
      query.createdAt = {
        ...(filters.from ? { $gte: new Date(filters.from) } : {}),
        ...(filters.to ? { $lte: new Date(filters.to + 'T23:59:59') } : {}),
      };
    }

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.txModel
        .find(query as any)
        .populate('itemId', 'name unit category')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.txModel.countDocuments(query as any),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Lab Cases ─────────────────────────────────────────────────────────────
  async createLabCase(
    tenantId: string,
    dto: Partial<LabCase>,
  ): Promise<LabCaseDocument> {
    const lc = new this.labCaseModel({
      ...dto,
      tenantId: new Types.ObjectId(tenantId),
    });
    return lc.save();
  }

  async getLabCases(
    tenantId: string,
    filters: { status?: string; doctorId?: string },
  ) {
    const query: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (filters.status) query.status = filters.status;
    if (filters.doctorId) query.doctorId = new Types.ObjectId(filters.doctorId);
    return this.labCaseModel
      .find(query as any)
      .populate('patientId', 'name phone patientId')
      .populate('doctorId', 'name email')
      .sort({ sentDate: -1 });
  }

  async updateLabCase(
    tenantId: string,
    id: string,
    dto: Partial<LabCase>,
  ): Promise<LabCaseDocument> {
    const lc = await this.labCaseModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      } as any,
      { $set: dto },
      { new: true },
    );
    if (!lc) throw new NotFoundException('Lab case not found');
    return lc;
  }

  async getPendingLabCases(tenantId: string) {
    return this.labCaseModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        status: { $in: ['SENT', 'IN_PROGRESS'] },
      } as any)
      .populate('patientId', 'name phone patientId')
      .populate('doctorId', 'name email');
  }
}
