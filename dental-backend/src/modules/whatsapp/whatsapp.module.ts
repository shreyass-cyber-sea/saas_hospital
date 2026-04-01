import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import {
  WhatsAppSession,
  WhatsAppSessionSchema,
} from './schemas/whatsapp-session.schema';
import {
  WhatsAppPhoneMapping,
  WhatsAppPhoneMappingSchema,
} from './schemas/whatsapp-phone-mapping.schema';
import { Patient, PatientSchema } from '../patients/patient.schema';
import { Appointment, AppointmentSchema } from '../appointments/appointment.schema';
import { BullModule } from '@nestjs/bull';
import { AppointmentReminderProcessor } from './jobs/reminder.job';
import { NoShowRecoveryProcessor } from './jobs/no-show-recovery.job';
import { AiModule } from '../ai/ai.module';
import { TenantModule } from '../tenant/tenant.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { BookingFlow } from './flows/booking.flow';
import { CancelFlow } from './flows/cancel.flow';
import { MyAppointmentsFlow } from './flows/my-appointments.flow';
import { MenuFlow } from './flows/menu.flow';
import { DateParserUtil } from './utils/date-parser.util';
import { WaSenderUtil } from './utils/wa-sender.util';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppSession.name, schema: WhatsAppSessionSchema },
      { name: WhatsAppPhoneMapping.name, schema: WhatsAppPhoneMappingSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    BullModule.registerQueue({
      name: 'whatsapp',
    }),
    AiModule,
    TenantModule,
    UsersModule,
    AppointmentsModule,
    PatientsModule,
  ],
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    AppointmentReminderProcessor,
    NoShowRecoveryProcessor,
    BookingFlow,
    CancelFlow,
    MyAppointmentsFlow,
    MenuFlow,
    DateParserUtil,
    WaSenderUtil,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule { }
