import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMode {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  invoiceNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  appointmentId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctorId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [
      {
        procedureId: { type: MongooseSchema.Types.ObjectId, ref: 'Procedure' },
        description: String,
        quantity: { type: Number, default: 1 },
        unitPrice: Number,
        discount: { type: Number, default: 0 },
        discountPercent: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 18 },
        taxAmount: Number,
        totalAmount: Number,
      },
    ],
    default: [],
  })
  lineItems: Array<{
    procedureId?: MongooseSchema.Types.ObjectId;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    discountPercent: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
  }>;

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  totalDiscount: number;

  @Prop({ type: Number, default: 0 })
  totalTax: number;

  @Prop({ type: Number, default: 0 })
  grandTotal: number;

  @Prop({ type: Number, default: 0 })
  paidAmount: number;

  @Prop({ type: Number, default: 0 })
  pendingAmount: number;

  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop({
    type: [
      {
        amount: Number,
        mode: { type: String, enum: PaymentMode },
        reference: String,
        paidAt: Date,
        recordedBy: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  payments: Array<{
    amount: number;
    mode: PaymentMode;
    reference?: string;
    paidAt: Date;
    recordedBy: MongooseSchema.Types.ObjectId;
  }>;

  @Prop({ type: Number, default: 0 })
  advanceUsed: number;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: String })
  pdfUrl: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, patientId: 1 });
InvoiceSchema.index({ tenantId: 1, status: 1 });
