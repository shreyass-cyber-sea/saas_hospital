import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum AppointmentType {
  NEW_PATIENT = 'NEW_PATIENT',
  FOLLOW_UP = 'FOLLOW_UP',
  PROCEDURE = 'PROCEDURE',
  EMERGENCY = 'EMERGENCY',
  CONSULTATION = 'CONSULTATION',
}

@Schema({ timestamps: true })
export class Appointment {
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

  @Prop({ type: String })
  chairId: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  startTime: string;

  @Prop({ type: String, required: true })
  endTime: string;

  @Prop({ type: Number, default: 30 })
  duration: number;

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Prop({
    type: String,
    enum: AppointmentType,
    default: AppointmentType.CONSULTATION,
  })
  type: AppointmentType;

  @Prop({ type: [String], default: [] })
  procedures: string[];

  @Prop({ type: String })
  notes: string;

  @Prop({ type: String })
  chiefComplaint: string;

  @Prop({ type: Number })
  tokenNumber: number;

  @Prop({ type: Boolean, default: false })
  reminderSent: boolean;

  @Prop({ type: String })
  cancelledReason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  rescheduledFrom: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Compound indexes for performance
AppointmentSchema.index({ tenantId: 1, date: 1, doctorId: 1 });
AppointmentSchema.index({ tenantId: 1, patientId: 1 });
AppointmentSchema.index({ tenantId: 1, status: 1 });
