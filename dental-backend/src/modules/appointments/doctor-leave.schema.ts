import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DoctorLeaveDocument = DoctorLeave & Document;

@Schema({ timestamps: true })
export class DoctorLeave {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String })
  reason: string;
}

export const DoctorLeaveSchema = SchemaFactory.createForClass(DoctorLeave);
DoctorLeaveSchema.index({ tenantId: 1, doctorId: 1, date: 1 });
