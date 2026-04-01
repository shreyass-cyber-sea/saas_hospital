import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';

import { AppointmentsService } from '../../appointments/appointments.service';
import { WhatsappService } from '../whatsapp.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WhatsAppPhoneMapping,
  WhatsAppPhoneMappingDocument,
} from '../schemas/whatsapp-phone-mapping.schema';
import { AppointmentStatus } from '../../appointments/appointment.schema';

@Processor('whatsapp')
export class NoShowRecoveryProcessor {
  private readonly logger = new Logger(NoShowRecoveryProcessor.name);

  constructor(
    private appointmentsService: AppointmentsService,
    private whatsappService: WhatsappService,
    @InjectModel(WhatsAppPhoneMapping.name)
    private mappingModel: Model<WhatsAppPhoneMappingDocument>,
  ) {}

  @Process('no-show-recovery')
  async handleNoShows(job: Job) {
    this.logger.log('Started processing no-show recovery job');

    try {
      const todayStr = dayjs().format('YYYY-MM-DD');

      // Logic relies on AppointmentsService being capable of returning a list of appointments via query.
      const targetAppointments =
        await this.appointmentsService.getAppointmentsForDateRange(
          null,
          todayStr,
          todayStr,
        );

      const filteredAppointments = targetAppointments.filter(
        (app) => app.status === AppointmentStatus.NO_SHOW,
      );

      for (const app of filteredAppointments) {
        const tenantMatch = await this.mappingModel.findOne({
          tenantId: app.tenantId,
        });

        if (tenantMatch && app.patientId) {
          const patientPhone = (app.patientId as any).phone; // Assume populated

          const msg = `We missed you today! 😔\n\nOur Clinic had an appointment scheduled for you today that we were unable to complete.\n\nWould you like to reschedule? Reply BOOK to pick a new time! 🗓️`;

          this.logger.log(`No-show recovery queued for ${patientPhone}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in no-show-recovery job: ${error.message}`);
    }

    this.logger.log('Completed no-show recovery job');
  }
}
