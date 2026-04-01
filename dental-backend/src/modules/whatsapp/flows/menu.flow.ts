import { Injectable } from '@nestjs/common';
import { WaSenderUtil } from '../utils/wa-sender.util';

@Injectable()
export class MenuFlow {
  constructor(private waSender: WaSenderUtil) { }

  // Main menu — 5 options → List Message (scrollable picker)
  async sendMenu(phone: string, clinicName: string, userName = '') {
    const greeting = userName
      ? `👋 Welcome back, *${userName}*!\n\nHow can we help you today at *${clinicName}*?`
      : `👋 Welcome to *${clinicName}*!\n\nHow can we help you today?`;

    await this.waSender.sendListMessage(
      phone,
      greeting,
      'View Options',
      '🏥 What would you like to do?',
      [
        { id: '1', title: '📅 Book Appointment', description: 'Schedule a new visit' },
        { id: '2', title: '📋 My Appointments', description: 'View your bookings' },
        { id: '3', title: '❌ Cancel Booking', description: 'Cancel an existing booking' },
        { id: '4', title: '👨‍⚕️ Our Doctors', description: 'Meet our dental team' },
        { id: '5', title: '❓ Help / FAQ', description: 'Clinic hours & contact info' },
      ],
      clinicName,
      'Tap "View Options" to choose',
    );
  }

  // Doctor list — up to 10 doctors → List Message
  async sendDoctorList(phone: string, doctors: { _id: any; name: string; doctorProfile?: { specialization?: string; experience?: number } }[]) {
    if (doctors.length === 0) {
      await this.waSender.sendTextMessage(phone, '❌ No doctors available at the moment. Please try again later or contact us directly.');
      return;
    }

    const rows = doctors.slice(0, 10).map((doc) => ({
      id: doc._id.toString(),
      title: doc.name,         // Already includes "Dr." from DB
      description: doc.doctorProfile?.specialization
        ? `${doc.doctorProfile.specialization}${doc.doctorProfile.experience ? ` · ${doc.doctorProfile.experience} yrs exp` : ''}`
        : 'General Dentistry',
    }));

    await this.waSender.sendListMessage(
      phone,
      '👨‍⚕️ *Select your preferred doctor:*',
      'Choose Doctor',
      '🩺 Our Dental Team',
      rows,
      'Book an Appointment',
      'Tap "Choose Doctor" to select',
    );
  }

  // Time slots — up to 10 slots → List Message
  async sendTimeSlots(phone: string, date: string, slots: string[]) {
    if (slots.length === 0) {
      await this.waSender.sendTextMessage(phone, `⚠️ No available slots for *${date}*.\n\nPlease reply with another date (e.g. "tomorrow", "5th March").`);
      return;
    }

    const rows = slots.slice(0, 10).map((slot) => ({
      id: slot,
      title: slot,
      description: 'Available · 30 min',
    }));

    await this.waSender.sendListMessage(
      phone,
      `⏰ *Available slots for ${date}:*\n\nSelect your preferred time:`,
      'Pick a Time',
      '🕐 Available Slots',
      rows,
      'Available Appointments',
      'Tap "Pick a Time" to select',
    );
  }

  // Yes/No confirmation — 2 options → Quick Reply Buttons (real blue buttons)
  async sendYesNoConfirmation(phone: string, message: string) {
    await this.waSender.sendQuickReplyButtons(
      phone,
      message,
      [
        { id: 'yes', title: '✅ Confirm' },
        { id: 'no', title: '❌ Cancel' },
      ],
    );
  }
}
