import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InventoryItemDocument = InventoryItem & Document;

export enum ItemCategory {
  CONSUMABLE = 'CONSUMABLE',
  INSTRUMENT = 'INSTRUMENT',
  MEDICATION = 'MEDICATION',
  LAB_MATERIAL = 'LAB_MATERIAL',
  IMPLANT = 'IMPLANT',
  CROWN = 'CROWN',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: ItemCategory, default: ItemCategory.CONSUMABLE })
  category: ItemCategory;

  @Prop({ type: String })
  unit: string;

  @Prop({ type: Number, default: 0 })
  currentStock: number;

  @Prop({ type: Number, default: 0 })
  minimumStock: number;

  @Prop({ type: Number, default: 0 })
  unitCost: number;

  @Prop({ type: Object })
  vendor: { name?: string; phone?: string; email?: string };

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);
InventoryItemSchema.index({ tenantId: 1, category: 1 });

// ─── Stock Transaction ──────────────────────────────────────────────────────
export type StockTransactionDocument = StockTransaction & Document;

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  USAGE = 'USAGE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

@Schema({ timestamps: true })
export class StockTransaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  })
  itemId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, default: 0 })
  unitCost: number;

  @Prop({ type: Number, default: 0 })
  totalCost: number;

  @Prop({ type: String })
  referenceNote: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient' })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  performedBy: MongooseSchema.Types.ObjectId;
}

export const StockTransactionSchema =
  SchemaFactory.createForClass(StockTransaction);
StockTransactionSchema.index({ tenantId: 1, itemId: 1 });
StockTransactionSchema.index({ tenantId: 1, type: 1 });

// ─── Lab Case ──────────────────────────────────────────────────────────────
export type LabCaseDocument = LabCase & Document;

export enum LabCaseStatus {
  SENT = 'SENT',
  IN_PROGRESS = 'IN_PROGRESS',
  RECEIVED = 'RECEIVED',
  FITTED = 'FITTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class LabCase {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  labName: string;

  @Prop({ type: String })
  caseType: string;

  @Prop({ type: String })
  shade: string;

  @Prop({ type: Date })
  sentDate: Date;

  @Prop({ type: Date })
  expectedReturnDate: Date;

  @Prop({ type: Date })
  actualReturnDate: Date;

  @Prop({ type: String, enum: LabCaseStatus, default: LabCaseStatus.SENT })
  status: LabCaseStatus;

  @Prop({ type: Number, default: 0 })
  cost: number;

  @Prop({ type: String })
  notes: string;
}

export const LabCaseSchema = SchemaFactory.createForClass(LabCase);
LabCaseSchema.index({ tenantId: 1, status: 1 });
