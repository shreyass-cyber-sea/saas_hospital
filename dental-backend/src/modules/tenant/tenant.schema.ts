import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: Object, required: false })
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };

  @Prop({ required: true, enum: ['FREE', 'BASIC', 'PRO'], default: 'FREE' })
  plan: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: Object,
    default: {
      workingHours: { start: '09:00', end: '20:00' },
      workingDays: [0, 1, 2, 3, 4, 5], // Monday to Saturday
      appointmentDuration: 30, // in minutes
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  })
  settings: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
