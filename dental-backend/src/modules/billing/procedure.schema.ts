import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProcedureDocument = Procedure & Document;

@Schema({ timestamps: true })
export class Procedure {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  code: string;

  @Prop({ type: String })
  category: string;

  @Prop({ type: Number, required: true })
  defaultPrice: number;

  @Prop({ type: Number, default: 30 })
  defaultDuration: number;

  @Prop({ type: Boolean, default: true })
  taxable: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ProcedureSchema = SchemaFactory.createForClass(Procedure);
ProcedureSchema.index({ tenantId: 1, code: 1 });
