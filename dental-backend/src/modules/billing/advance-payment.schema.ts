import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentMode } from './invoice.schema';

export type AdvancePaymentDocument = AdvancePayment & Document;

@Schema({ timestamps: true })
export class AdvancePayment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number, required: true })
  balance: number;

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

  @Prop({ type: String })
  notes: string;
}

export const AdvancePaymentSchema =
  SchemaFactory.createForClass(AdvancePayment);
AdvancePaymentSchema.index({ tenantId: 1, patientId: 1 });
