import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppPhoneMappingDocument = WhatsAppPhoneMapping & Document;

@Schema({ timestamps: true, collection: 'wa_phone_mappings' })
export class WhatsAppPhoneMapping {
  @Prop({ required: true, index: true })
  whatsappPhoneNumberId: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const WhatsAppPhoneMappingSchema =
  SchemaFactory.createForClass(WhatsAppPhoneMapping);
