import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../../appointments/appointments.service';
import { WaSenderUtil } from '../utils/wa-sender.util';

@Injectable()
export class MyAppointmentsFlow {
  constructor(
    private appointmentsService: AppointmentsService,
    private waSender: WaSenderUtil,
  ) {}

  async handleRetrieval(phone: string) {
    try {
      await this.waSender.sendTextMessage(
        phone,
        `Looking up your upcoming appointments... 🔍\n\n(Integration pending connection to Patient Phone Index).`,
      );
    } catch {
      await this.waSender.sendTextMessage(
        phone,
        `Unable to pull your records right now. Please try again later.`,
      );
    }
  }
}
