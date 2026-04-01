import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PatientDocumentDoc = PatientDocument & Document;

@Schema({ timestamps: true })
export class PatientDocument {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  appointmentId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({
    type: String,
    enum: ['xray', 'report', 'consent', 'other'],
    default: 'other',
  })
  fileType: string;

  @Prop({ type: String, required: true })
  fileUrl: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  uploadedBy: MongooseSchema.Types.ObjectId;
}

export const PatientDocumentSchema =
  SchemaFactory.createForClass(PatientDocument);
PatientDocumentSchema.index({ tenantId: 1, patientId: 1 });
