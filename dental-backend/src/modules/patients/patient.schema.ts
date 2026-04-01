import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PatientDocument = Patient & Document;

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Patient {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  patientId: string; // e.g. LDC-2024-0001

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: Date })
  dateOfBirth: Date;

  @Prop({ type: String, enum: Gender })
  gender: Gender;

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    pincode: string;
  };

  @Prop({ type: String })
  bloodGroup: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: String })
  medicalHistory: string;

  @Prop({ type: String })
  abhaId: string;

  @Prop({ type: Object })
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  firstVisit: Date;

  @Prop({ type: Date })
  lastVisit: Date;

  @Prop({ type: Number, default: 0 })
  totalVisits: number;

  @Prop({ type: Boolean, default: true })
  whatsappOptIn: boolean;

  @Prop({ type: String })
  photoUrl: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// Compound indexes
PatientSchema.index({ tenantId: 1, phone: 1 });
PatientSchema.index({ tenantId: 1, patientId: 1 }, { unique: true });
PatientSchema.index({ tenantId: 1, name: 'text', phone: 'text' });
