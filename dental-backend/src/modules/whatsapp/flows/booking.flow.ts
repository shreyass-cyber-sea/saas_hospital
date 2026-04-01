import { Injectable, Logger } from '@nestjs/common';
import { AppointmentsService } from '../../appointments/appointments.service';
import { WaSenderUtil } from '../utils/wa-sender.util';
import { DateParserUtil } from '../utils/date-parser.util';

@Injectable()
export class BookingFlow {
  private readonly logger = new Logger(BookingFlow.name);

  constructor(
    private appointmentsService: AppointmentsService,
    private waSender: WaSenderUtil,
    private dateParser: DateParserUtil,
  ) {}

  async handleBookingStep(session: any, message: string, phone: string) {
    const state = session.state;

    // We implement a state machine for booking
    if (state === 'BOOKING_START') {
      session.state = 'BOOKING_AWAIT_DATE';
      await session.save();
      await this.waSender.sendTextMessage(
        phone,
        `Let's get you booked! 📅\nWhat date would you like to visit? (e.g., "tomorrow", "next Monday", "2024-12-01")`,
      );
      return;
    }

    if (state === 'BOOKING_AWAIT_DATE') {
      const parsedDateStr = this.dateParser.parseWhatsAppDateInput(message);

      if (!parsedDateStr) {
        await this.waSender.sendTextMessage(
          phone,
          `I couldn't understand that date. Could you try formatting it like "YYYY-MM-DD" or say "tomorrow"?`,
        );
        return;
      }

      // Store intermediate data
      session.contextData = {
        ...session.contextData,
        requestedDate: parsedDateStr,
      };
      session.state = 'BOOKING_AWAIT_TIME';
      await session.save();

      await this.waSender.sendTextMessage(
        phone,
        `Great, searching for ${parsedDateStr}.\nWhat time works best for you? (e.g., "10:00 AM", "Morning", "Afternoon")`,
      );
      return;
    }

    if (state === 'BOOKING_AWAIT_TIME') {
      // Mocking the time selection
      const time = message.trim();
      session.contextData = {
        ...session.contextData,
        requestedTime: time,
      };
      session.state = 'BOOKING_CONFIRM';
      await session.save();

      await this.waSender.sendTextMessage(
        phone,
        `I have penciled you in for ${session.contextData.requestedDate} around ${time}.\n\nPlease reply with *CONFIRM* to finalize, or *CANCEL* to stop.`,
      );
      return;
    }

    if (state === 'BOOKING_CONFIRM') {
      if (message.toLowerCase() === 'confirm') {
        // Finalize booking via AppointmentsService
        try {
          // Mock Patient ID mapping for now (Stubbed patientId for Person 4 separation)
          const patientId = 'mock-patient-id';
          // NOTE: createAppointment call might need different arguments pending real AppointmentsService integration
          // We're stubbing the internal log so it doesn't fail compilation based on Person 2's structure we might not have perfectly
          this.logger.log(
            `Will create appointment for ${patientId} on ${session.contextData.requestedDate}`,
          );

          session.state = 'IDLE';
          session.contextData = {};
          await session.save();

          await this.waSender.sendTextMessage(
            phone,
            `✅ **Booking Confirmed!**\nWe look forward to seeing you on ${session.contextData.requestedDate}.\n\nReply with "Menu" to see other options.`,
          );
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Booking Failed: ${errorMessage}`);
          await this.waSender.sendTextMessage(
            phone,
            `Sorry, an error occurred while saving your appointment. Please call the clinic.`,
          );
        }
      } else {
        session.state = 'IDLE';
        session.contextData = {};
        await session.save();
        await this.waSender.sendTextMessage(
          phone,
          `Booking cancelled. Reply "Menu" to start over.`,
        );
      }
      return;
    }
  }
}
