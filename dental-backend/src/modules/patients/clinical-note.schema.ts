import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClinicalNoteDocument = ClinicalNote & Document;

class Prescription {
  @Prop() medicine: string;
  @Prop() dosage: string;
  @Prop() duration: string;
  @Prop() instructions: string;
}

@Schema({ timestamps: true })
export class ClinicalNote {
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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  chiefComplaint: string;

  @Prop({ type: String })
  clinicalFindings: string;

  @Prop({ type: String })
  diagnosis: string;

  @Prop({ type: String })
  treatmentDone: string;

  @Prop({ type: String })
  treatmentPlan: string;

  @Prop({ type: [Object], default: [] })
  prescriptions: Prescription[];

  @Prop({ type: Object })
  toothChart: Record<string, unknown>;

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export const ClinicalNoteSchema = SchemaFactory.createForClass(ClinicalNote);
ClinicalNoteSchema.index({ tenantId: 1, patientId: 1 });
