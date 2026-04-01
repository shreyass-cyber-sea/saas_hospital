import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppSessionDocument = WhatsAppSession & Document;

export enum SessionState {
  IDLE = 'IDLE',
  BOOKING_START = 'BOOKING_START',
  SELECTING_DOCTOR = 'SELECTING_DOCTOR',
  SELECTING_DATE = 'SELECTING_DATE',
  SELECTING_SLOT = 'SELECTING_SLOT',
  AWAITING_NAME = 'AWAITING_NAME',
  AWAITING_DATE = 'AWAITING_DATE',
  AWAITING_DOCTOR_CHOICE = 'AWAITING_DOCTOR_CHOICE',
  AWAITING_SLOT = 'AWAITING_SLOT',
  BOOKING_CONFIRM = 'BOOKING_CONFIRM',
  RESCHEDULE_SELECT = 'RESCHEDULE_SELECT',
  CANCEL_SELECT = 'CANCEL_SELECT',
  // New patient registration during booking
  ENTERING_PATIENT_NAME = 'ENTERING_PATIENT_NAME',
  ENTERING_PATIENT_PHONE = 'ENTERING_PATIENT_PHONE',
}

@Schema({ timestamps: true, collection: 'wa_sessions' })
export class WhatsAppSession {
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ enum: SessionState, default: SessionState.IDLE })
  state: SessionState;

  @Prop({ type: Object, default: {} })
  context: Record<string, any>;

  // TTL index: automatically delete/expire documents after 30 minutes of inactivity
  @Prop({ required: true, index: { expires: '30m' }, default: Date.now })
  lastInteraction: Date;
}

export const WhatsAppSessionSchema =
  SchemaFactory.createForClass(WhatsAppSession);
