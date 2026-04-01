import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';

import {
  WhatsAppSession,
  WhatsAppSessionDocument,
  SessionState,
} from './schemas/whatsapp-session.schema';
import {
  WhatsAppPhoneMapping,
  WhatsAppPhoneMappingDocument,
} from './schemas/whatsapp-phone-mapping.schema';
import { TenantService } from '../tenant/tenant.service';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import { Patient, PatientDocument } from '../patients/patient.schema';
import { Appointment, AppointmentDocument } from '../appointments/appointment.schema';
import { BookingFlow } from './flows/booking.flow';
import { CancelFlow } from './flows/cancel.flow';
import { MyAppointmentsFlow } from './flows/my-appointments.flow';
import { MenuFlow } from './flows/menu.flow';
import { WaSenderUtil } from './utils/wa-sender.util';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectModel(WhatsAppSession.name)
    private sessionModel: Model<WhatsAppSessionDocument>,
    @InjectModel(WhatsAppPhoneMapping.name)
    private mappingModel: Model<WhatsAppPhoneMappingDocument>,
    @InjectModel(Patient.name)
    private patientModel: Model<PatientDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private tenantService: TenantService,
    private usersService: UsersService,
    private aiService: AiService,
    private bookingFlow: BookingFlow,
    private cancelFlow: CancelFlow,
    private myAppointmentsFlow: MyAppointmentsFlow,
    private menuFlow: MenuFlow,
    private waSender: WaSenderUtil,
  ) { }

  // Get doctors for a tenant — queries DB directly (no HTTP, no auth token needed)
  async getDoctors(tenantId: string) {
    try {
      const doctors = await this.usersService.findDoctorsByTenant(tenantId);
      this.logger.debug(`Found ${doctors.length} doctors for tenant ${tenantId}`);
      return doctors;
    } catch (error) {
      this.logger.error('Failed to fetch doctors:', error.message);
      return [];
    }
  }

  // Get available 30-min slots for a doctor on a date — queries DB directly
  async getAvailableSlots(tenantId: string, doctorId: string, date: string) {
    try {
      // All possible 30-min slots from 09:00 to 19:00
      const allSlots: string[] = [];
      for (let h = 9; h < 19; h++) {
        allSlots.push(`${String(h).padStart(2, '0')}:00`);
        allSlots.push(`${String(h).padStart(2, '0')}:30`);
      }

      // Find booked appointments for this doctor on this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const booked = await this.appointmentModel.find({
        tenantId: new Types.ObjectId(tenantId),
        doctorId: new Types.ObjectId(doctorId),
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      } as any).select('startTime').lean();

      const bookedTimes = new Set(booked.map((a: any) => a.startTime));
      const available = allSlots.filter(slot => !bookedTimes.has(slot));
      this.logger.debug(`Slots for ${doctorId} on ${date}: ${available.length} available`);
      return available;
    } catch (error) {
      this.logger.error('Failed to fetch slots:', error.message);
      return [];
    }
  }

  async processMessage(
    from: string,
    text: string,
    phoneNumberId: string,
    senderName = '',
  ): Promise<void> {
    const normalizedText = text.trim().toLowerCase();

    // 1. Find Tenant via Phone Number mapping
    const mapping = await this.mappingModel.findOne({
      whatsappPhoneNumberId: phoneNumberId,
    });
    if (!mapping || !mapping.isActive) {
      this.logger.warn(
        `Received message on unmapped/inactive number ID: ${phoneNumberId}`,
      );
      return;
    }

    const tenantIdStr = mapping.tenantId.toString();

    // 2. Load or Create Session
    const now = new Date();
    let session = await this.sessionModel.findOne({
      phone: from,
      tenantId: mapping.tenantId,
    });

    if (!session) {
      session = new this.sessionModel({
        phone: from,
        tenantId: mapping.tenantId,
      });
    } else {
      // TTL Check: reset session if inactive for >30m
      const diffMs = now.getTime() - session.lastInteraction.getTime();
      const diffMins = diffMs / 60000;
      if (diffMins > 30) {
        session.state = SessionState.IDLE;
        session.context = {};
      }
    }

    session.lastInteraction = now;

    // Auto-store WhatsApp profile name in session context if we have it
    if (senderName && !session.context?.profileName) {
      session.context = { ...session.context, profileName: senderName };
    }

    // 3. Priority Keyword Overrides
    const isPriorityKeyword = await this.handlePriorityKeywords(
      from,
      normalizedText,
      tenantIdStr,
      session,
    );

    if (isPriorityKeyword) {
      await session.save();
      return;
    }

    // 4. State-Based Routing (Button Flow)
    switch (session.state) {
      // Handle doctor selection (can be number or doctor ID)
      case SessionState.SELECTING_DOCTOR:
        let selectedDoctorId: string;

        // Check if user sent a number (1, 2, 3...)
        const num = parseInt(text);
        const doctorList = session.context?.doctorList || [];

        if (!isNaN(num) && num > 0 && num <= doctorList.length) {
          // User replied with a number - get the doctor ID from the list
          selectedDoctorId = doctorList[num - 1];
        } else {
          // User replied with doctor ID directly
          selectedDoctorId = text;
        }

        if (!selectedDoctorId) {
          await this.sendMessage(
            from,
            `Invalid selection. Please reply with a number from the list (1-${doctorList.length})`
          );
          break;
        }

        session.context = {
          ...session.context,
          selectedDoctorId,
        };
        session.state = SessionState.SELECTING_DATE;
        await this.sendDateMenu(from);
        break;

      // Handle date selection
      case SessionState.SELECTING_DATE:
        const doctorId = session.context?.selectedDoctorId;
        // Handle numbered quick picks: 1=Today, 2=Tomorrow, 3=Day After, 4=custom
        let dateText = text.trim();
        if (dateText === '1') dateText = 'today';
        else if (dateText === '2') dateText = 'tomorrow';
        else if (dateText === '3') dateText = 'day after';
        // 4 or anything else = treat as custom date text
        if (dateText === '4') {
          await this.sendMessage(from, '📅 Please type the date (e.g. *5th March*, *10/03*, *15 April*):');
          break; // stay in SELECTING_DATE
        }
        const parsedDate = this.parseDate(dateText, tenantIdStr);
        if (parsedDate) {
          session.context = { ...session.context, selectedDate: parsedDate, slotList: [] };
          session.state = SessionState.SELECTING_SLOT;
          const slots = await this.getAvailableSlots(tenantIdStr, doctorId, parsedDate);
          session.context.slotList = slots;
          if (slots.length > 0) {
            await this.menuFlow.sendTimeSlots(from, parsedDate, slots);
          } else {
            await this.sendMessage(from,
              `😔 No slots available for ${parsedDate}.\n\nPlease choose another date:`);
            await this.sendDateMenu(from);
            session.state = SessionState.SELECTING_DATE;
          }
        } else {
          await this.sendMessage(from,
            `❌ Couldn't understand that date. Please try again:`);
          await this.sendDateMenu(from);
        }
        break;

      // Handle time slot selection (can be number or time like "10:00")
      case SessionState.SELECTING_SLOT:
        let selectedSlot: string;

        // Check if user sent a number (1, 2, 3...)
        const slotNum = parseInt(text);
        const slotList = session.context?.slotList || [];

        if (!isNaN(slotNum) && slotNum > 0 && slotNum <= slotList.length) {
          // User replied with a number - get the slot from the list
          selectedSlot = slotList[slotNum - 1];
        } else {
          // User replied with time directly
          selectedSlot = text;
        }

        if (!selectedSlot) {
          await this.sendMessage(
            from,
            `Invalid selection. Please reply with a number from the list (1-${slotList.length})`
          );
          break;
        }

        // Book the appointment — ask user to confirm their name
        const profileName: string = session.context?.profileName || '';

        session.context = {
          ...session.context,
          pendingSlot: selectedSlot,
          pendingPatientName: profileName,
        };

        if (profileName) {
          await this.sendMessage(
            from,
            `👤 *Confirm your name:*\n\n` +
            `1. ${profileName} ✅\n` +
            `2. Enter a different name\n` +
            `0. ↩️ Back\n\n` +
            `Reply *1* to confirm, *2* to change, or *0* to go back.`,
          );
        } else {
          await this.sendMessage(from, `👤 Please type your *full name* for the appointment:\n\n_Reply *0* to go back._`);
        }
        session.state = SessionState.ENTERING_PATIENT_NAME;
        break;

      // CONFIRM or CHANGE patient name
      case SessionState.ENTERING_PATIENT_NAME:
        const profileForName: string = session.context?.pendingPatientName || session.context?.profileName || '';
        let finalName: string;

        if (text.trim() === '1' && profileForName) {
          // User confirmed their profile name
          finalName = profileForName;
        } else if (text.trim() === '2' && profileForName) {
          // User wants to enter a different name
          await this.sendMessage(from, '✏️ Please type your full name:');
          break; // stay in state, next message will be the name
        } else {
          // User typed a name directly
          finalName = text.trim();
          if (!finalName || finalName.length < 2) {
            await this.sendMessage(from, '❌ Please enter your full name (at least 2 characters).');
            break;
          }
        }

        session.context = { ...session.context, pendingPatientName: finalName };
        session.state = SessionState.ENTERING_PATIENT_PHONE;
        const waNum = from.replace(/\D/g, '');
        await this.sendMessage(
          from,
          `📞 *Confirm your phone number:*\n\n` +
          `1. +${waNum} (your WhatsApp number) ✅\n` +
          `2. Enter a different number\n` +
          `0. ↩️ Back\n\n` +
          `Reply *1* to confirm, *2* for a different number, or *0* to go back.`,
        );
        break;

      // CONFIRM or ENTER phone → create patient + book
      case SessionState.ENTERING_PATIENT_PHONE:
        const waNumForPhone = from.replace(/\D/g, '');
        let phoneIn: string = '';

        if (text.trim() === '1') {
          // User confirmed their WhatsApp number
          phoneIn = waNumForPhone;
        } else if (text.trim() === '2') {
          // User wants to type a different number
          await this.sendMessage(from, '✏️ Please type your phone number (digits only, e.g. 9876543210):');
          // Important: exit early, wait for next message
          return;
        } else {
          // User typed a custom number directly
          const rawNum = text.trim().replace(/\D/g, '');
          if (rawNum.length < 6) {
            await this.sendMessage(from, '❌ Please enter a valid phone number (digits only, e.g. 9876543210):');
            return;
          }
          phoneIn = rawNum;
        }

        // We have a confirmed phone number, proceed to book
        const bookPatName = session.context?.pendingPatientName || 'Patient';
        const bookSlot = session.context?.pendingSlot;
        const bookDate = session.context?.selectedDate;
        const bookDoc = session.context?.selectedDoctorId;

        try {
          // Generate patientId to satisfy DB schema validation requirements
          const year = new Date().getFullYear();
          const pCount = await this.patientModel.countDocuments({
            tenantId: new Types.ObjectId(tenantIdStr),
          } as any);
          const seq = String(pCount + 1).padStart(4, '0');
          const autoPatientId = `CLN-${year}-${seq}`;

          const createdPatient = await this.patientModel.create({
            name: bookPatName,
            phone: phoneIn,
            patientId: autoPatientId,
            tenantId: new Types.ObjectId(tenantIdStr),
          } as any);

          await this.bookAppointmentAndConfirm(from, tenantIdStr, createdPatient as any, bookDoc as string, bookDate as string, bookSlot as string);

          // Reset session after successful booking
          session.state = SessionState.IDLE;
          session.context = { profileName: session.context?.profileName }; // keep name cached
        } catch (err) {
          this.logger.error('Failed to create patient and book:', err);
          await this.sendMessage(from, '❌ Sorry, something went wrong while confirming your booking. Please try again or contact us directly.');
          // Reset so they don't get stuck in the phone state forever
          session.state = SessionState.IDLE;
          session.context = { profileName: session.context?.profileName };
        }
        break;

      // Original booking flow states
      case SessionState.AWAITING_NAME:
      case SessionState.AWAITING_DATE:
      case SessionState.AWAITING_DOCTOR_CHOICE:
      case SessionState.AWAITING_SLOT:
      case SessionState.BOOKING_CONFIRM:
        await this.bookingFlow.handleBookingStep(
          session,
          text,
          from
        );
        break;
      case SessionState.RESCHEDULE_SELECT:
      case SessionState.CANCEL_SELECT:
        await this.cancelFlow.handleCancel(from);
        break;
      case SessionState.IDLE:
      default:
        // Route to Gemini for conversational fallback
        const aiReply = await this.aiService.generateReply(
          tenantIdStr,
          text,
          session.context,
        );
        await this.sendMessage(from, aiReply);
        break;
    }

    // 5. Save updated session state
    await session.save();
  }

  // --- Core Helpers ---
  private async sendMessage(to: string, body: string) {
    await this.waSender.sendTextMessage(to, body);
  }

  // Sends a numbered date picker menu
  private async sendDateMenu(to: string) {
    const today = dayjs();
    await this.sendMessage(
      to,
      `📅 *Select a date:*\n\n` +
      `1. Today (${today.format('D MMM')})\n` +
      `2. Tomorrow (${today.add(1, 'day').format('D MMM')})\n` +
      `3. Day after tomorrow (${today.add(2, 'day').format('D MMM')})\n` +
      `4. Enter a specific date\n\n` +
      `Reply with *1*, *2*, *3*, or *4*.`,
    );
  }

  // Parse natural language date to YYYY-MM-DD format
  private parseDate(text: string, tenantId: string): string | null {
    const normalized = text.toLowerCase().trim();
    const today = dayjs();

    // Handle common date expressions
    if (normalized === 'today') {
      return today.format('YYYY-MM-DD');
    }
    if (normalized === 'tomorrow' || normalized === 'tmrw') {
      return today.add(1, 'day').format('YYYY-MM-DD');
    }
    if (normalized === 'day after' || normalized === 'day after tomorrow') {
      return today.add(2, 'day').format('YYYY-MM-DD');
    }

    // Try to parse dates like "25th March", "March 25", "25/03/2026"
    const parsed = dayjs(normalized, [
      'D MMMM', 'D MMM', 'MMMM D', 'MMM D',
      'D/M/YYYY', 'DD/MM/YYYY', 'D-M-YYYY',
      'YYYY-MM-DD'
    ], true);

    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }

    // Try flexible parsing
    const flexible = dayjs(normalized);
    if (flexible.isValid() && flexible.isAfter(today.subtract(1, 'day'))) {
      return flexible.format('YYYY-MM-DD');
    }

    return null;
  }

  private async handlePriorityKeywords(
    from: string,
    text: string,
    tenantId: string,
    session: WhatsAppSessionDocument,
  ): Promise<boolean> {
    const greetings = ['hi', 'hello', 'hey', 'start', 'menu'];

    // Greetings always reset to main menu regardless of state
    if (greetings.includes(text)) {
      const tenant = await this.tenantService.getTenantById(tenantId);
      const userName: string = session.context?.profileName || '';
      await this.menuFlow.sendMenu(from, tenant?.name || 'our Clinic', userName);
      session.state = SessionState.IDLE;
      // Preserve the profileName across sessions
      session.context = { profileName: session.context?.profileName };
      return true;
    }

    // ↩️ BACK — "0" or "back" goes to the previous booking step (any non-IDLE state)
    if ((text === '0' || text === 'back') && session.state !== SessionState.IDLE) {
      switch (session.state) {
        case SessionState.SELECTING_DATE:
          // Back from date → re-show doctor list
          session.state = SessionState.SELECTING_DOCTOR;
          const doctors = await this.getDoctors(tenantId);
          session.context = { ...session.context, doctorList: doctors.map(d => d.id) };
          await this.menuFlow.sendDoctorList(from, doctors as any);
          break;
        case SessionState.SELECTING_SLOT:
          // Back from slot → re-show date menu
          session.state = SessionState.SELECTING_DATE;
          await this.sendDateMenu(from);
          break;
        case SessionState.ENTERING_PATIENT_NAME:
          // Back from name → re-show time slots
          session.state = SessionState.SELECTING_SLOT;
          const slots: string[] = session.context?.slotList || [];
          const selDate: string = session.context?.selectedDate || '';
          if (slots.length > 0) {
            await this.menuFlow.sendTimeSlots(from, selDate, slots);
          } else {
            await this.sendDateMenu(from);
            session.state = SessionState.SELECTING_DATE;
          }
          break;
        case SessionState.ENTERING_PATIENT_PHONE:
          // Back from phone → re-ask name
          session.state = SessionState.ENTERING_PATIENT_NAME;
          const pName: string = session.context?.pendingPatientName || session.context?.profileName || '';
          if (pName) {
            await this.sendMessage(
              from,
              `👤 *Confirm your name:*\n\n` +
              `1. ${pName} ✅\n` +
              `2. Enter a different name\n` +
              `0. ↩️ Back\n\n` +
              `Reply *1* to confirm, *2* to change, or *0* to go back.`,
            );
          } else {
            await this.sendMessage(from, `👤 Please type your *full name* for the appointment:\n\n_Reply *0* to go back._`);
          }
          break;
        default:
          // Unknown state — reset to menu
          const tenant2 = await this.tenantService.getTenantById(tenantId);
          await this.menuFlow.sendMenu(from, tenant2?.name || 'our Clinic', session.context?.profileName || '');
          session.state = SessionState.IDLE;
      }
      return true;
    }

    // ⚠️ CRITICAL: Number shortcuts (1-5) and booking keywords ONLY apply
    // when session is IDLE. Otherwise they get routed to the state machine below.
    if (session.state !== SessionState.IDLE) {
      return false;
    }

    // Option 1: Book Appointment — show doctor list
    if (text === '1' || text === 'book' || text === 'appointment') {
      const doctors = await this.getDoctors(tenantId);
      session.context = {
        ...session.context,
        doctorList: doctors.map(d => d.id),
      };
      session.state = SessionState.SELECTING_DOCTOR;
      await this.menuFlow.sendDoctorList(from, doctors as any);
      return true;
    }

    // Option 2: My Appointments
    if (text === '2' || text === 'my appointments') {
      await this.myAppointmentsFlow.handleRetrieval(from);
      session.state = SessionState.IDLE;
      return true;
    }

    // Option 3: Cancel Booking
    if (text === '3' || text === 'cancel') {
      await this.cancelFlow.handleCancel(from);
      session.state = SessionState.IDLE;
      return true;
    }

    // Option 4: Our Doctors (info only, no booking state change)
    if (text === '4' || text === 'doctors' || text === 'our doctors') {
      const doctors = await this.getDoctors(tenantId);
      await this.menuFlow.sendDoctorList(from, doctors as any);
      session.state = SessionState.IDLE;
      return true;
    }

    // Option 5: Help / FAQ
    if (text === '5' || text === 'help' || text === 'faq') {
      const msg =
        `❓ *Help & FAQ*\n\n` +
        `• *Book appointment?* — Reply *1*\n` +
        `• *View my bookings?* — Reply *2*\n` +
        `• *Cancel booking?* — Reply *3*\n` +
        `• *Our doctors?* — Reply *4*\n` +
        `• *Clinic hours:* Mon–Sat 9 AM–7 PM\n\n` +
        `For emergencies call us directly. Reply *hi* for the main menu.`;
      await this.sendMessage(from, msg);
      session.state = SessionState.IDLE;
      return true;
    }

    return false;
  }

  // Shared helper — creates appointment + sends WhatsApp confirmation
  private async bookAppointmentAndConfirm(
    to: string,
    tenantIdStr: string,
    patient: { _id: any; name: string; email?: string },
    doctorId: string,
    date: string,
    slot: string,
  ): Promise<void> {
    try {
      const [hours, minutes] = slot.split(':');
      const startDT = new Date(date);
      startDT.setHours(parseInt(hours), parseInt(minutes));
      const endDT = new Date(startDT.getTime() + 30 * 60000);
      const endHH = String(endDT.getHours()).padStart(2, '0');
      const endMM = String(endDT.getMinutes()).padStart(2, '0');

      await this.appointmentModel.create({
        patientId: patient._id,
        doctorId: new Types.ObjectId(doctorId),
        date: new Date(date),
        startTime: slot,
        endTime: `${endHH}:${endMM}`,
        type: 'CONSULTATION',
        status: 'SCHEDULED',
        duration: 30,
        tenantId: new Types.ObjectId(tenantIdStr),
      } as any);

      const doc = await this.usersService.findById(doctorId);
      const doctorName = doc?.name || 'your doctor';
      const formattedDate = new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      await this.sendMessage(
        to,
        `✅ *Appointment Confirmed!*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Patient:* ${patient.name}\n` +
        `🩺 *Doctor:* ${doctorName}\n` +
        `📅 *Date:* ${formattedDate}\n` +
        `⏰ *Time:* ${slot}\n` +
        `💬 *Type:* Consultation\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Please arrive 10 minutes early.\n` +
        `Reply *hi* to return to the main menu.`,
      );
    } catch (error) {
      this.logger.error('bookAppointmentAndConfirm failed:', error);
      await this.sendMessage(to, '❌ Sorry, could not complete your booking. Please try again.');
    }
  }
}
