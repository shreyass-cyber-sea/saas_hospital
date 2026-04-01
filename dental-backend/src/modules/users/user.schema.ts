import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../../common/constants/roles.constant';
import { Tenant } from '../tenant/tenant.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false }) // Don't return password by default
  passwordHash: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  // Conditionally required if DOCTOR
  @Prop({ type: Object, required: false })
  doctorProfile?: {
    specialization: string;
    registrationNumber: string;
    availableChairs?: number;
    consultationDuration?: number; // per patient in minutes
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
