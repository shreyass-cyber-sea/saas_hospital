import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Appointment,
  AppointmentStatus,
  DoctorLeave,
} from '@prisma/client';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateStatusDto,
  CreateDoctorLeaveDto,
} from './dto/appointment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EmailService } from '../notifications/email.service';
import { PatientsService } from '../patients/patients.service';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private patientsService: PatientsService,
    private usersService: UsersService,
    private tenantService: TenantService,
  ) { }

  // ─── Slot Generation ───────────────────────────────────────────────────────
  async getAvailableSlots(
    tenantId: string,
    doctorId: string,
    dateStr: string,
    slotDuration = 30,
  ): Promise<string[]> {
    const date = new Date(dateStr);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const tenant = await this.tenantService.getTenantById(tenantId);
    const settings = (tenant.settings as Record<string, any>) || {};
    const workingHours = settings.workingHours || { start: '09:00', end: '20:00' };
    const workingDays: number[] = Array.isArray(settings.workingDays)
      ? settings.workingDays
      : [0, 1, 2, 3, 4, 5];
    const effectiveSlotDuration =
      Number(slotDuration) ||
      Number(settings.appointmentDuration) ||
      30;

    const jsDay = date.getDay();
    const normalizedWorkingDays = workingDays.map((day) =>
      day === 0 ? 1 : day === 6 ? 0 : day + 1,
    );

    if (!normalizedWorkingDays.includes(jsDay)) {
      return [];
    }

    // Check if doctor is on leave
    const onLeave = await this.prisma.doctorLeave.findFirst({
      where: {
        tenantId,
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });
    if (onLeave) return [];

    // Get booked slots for this doctor on this date
    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      select: { startTime: true },
    });

    const bookedSlots = new Set(bookedAppointments.map((a) => a.startTime));

    const [startHour, startMinute] = String(workingHours.start || '09:00')
      .split(':')
      .map((value) => parseInt(value, 10));
    const [endHour, endMinute] = String(workingHours.end || '20:00')
      .split(':')
      .map((value) => parseInt(value, 10));

    const allSlots: string[] = [];
    let hour = Number.isFinite(startHour) ? startHour : 9;
    let minute = Number.isFinite(startMinute) ? startMinute : 0;
    const endTotalMinutes =
      (Number.isFinite(endHour) ? endHour : 20) * 60 +
      (Number.isFinite(endMinute) ? endMinute : 0);

    while (hour * 60 + minute < endTotalMinutes) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      allSlots.push(timeStr);
      minute += effectiveSlotDuration;
      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute = minute % 60;
      }
    }

    return allSlots.filter((slot) => !bookedSlots.has(slot));
  }

  // ─── Token Management ───────────────────────────────────────────────────────
  private async getNextToken(
    tenantId: string,
    doctorId: string,
    date: Date,
  ): Promise<number> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const lastAppointment = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
        tokenNumber: { not: null },
      },
      orderBy: { tokenNumber: 'desc' },
    });

    return lastAppointment?.tokenNumber ? lastAppointment.tokenNumber + 1 : 1;
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  async create(
    tenantId: string,
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const date = new Date(dto.date);

    // Conflict Prevention: check for overlapping appointments
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        doctorId: dto.doctorId,
        date: { gte: dayStart, lte: dayEnd },
        startTime: dto.startTime,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Doctor already has an appointment at ${dto.startTime} on this date.`,
      );
    }

    const tokenNumber = await this.getNextToken(tenantId, dto.doctorId, date);
    const appointmentData = {
      tenantId,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      type: dto.type,
      chiefComplaint: dto.chiefComplaint || undefined,
      tokenNumber,
      createdByUserId: userId,
    };

    const appointment = await this.prisma.appointment.create({
      data: appointmentData,
    });

    // Send confirmation email asynchronously
    this.sendAppointmentConfirmationEmail(tenantId, appointment as any).catch(
      (emailError) => {
        this.logger.error(
          `Failed to send confirmation email: ${emailError.message}`,
        );
      },
    );

    return appointment;
  }

  private async sendAppointmentConfirmationEmail(
    tenantId: string,
    appointment: Appointment,
  ): Promise<void> {
    const patient = await this.patientsService.findById(appointment.patientId);
    if (!patient || !patient.email) return;

    const doctor = await this.usersService.findById(appointment.doctorId);
    if (!doctor) return;

    const tenant = await this.tenantService.getTenantById(tenantId);
    if (!tenant) return;

    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const [hours, minutes] = appointment.startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.emailService.sendAppointmentConfirmation({
      patientName: patient.name,
      patientEmail: patient.email,
      doctorName: doctor.name,
      clinicName: tenant.name,
      appointmentDate: formattedDate,
      appointmentTime: formattedTime,
      appointmentType: appointment.type || 'Consultation',
      chiefComplaint: appointment.chiefComplaint || undefined,
      tokenNumber: appointment.tokenNumber as number,
      clinicPhone: tenant.phone as string,
    });
  }

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters: {
      date?: string;
      doctorId?: string;
      status?: AppointmentStatus;
      patientId?: string;
    },
  ) {
    const where: any = { tenantId };

    if (filters.date) {
      const day = new Date(filters.date);
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.status) where.status = filters.status;
    if (filters.patientId) where.patientId = filters.patientId;

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { name: true, phone: true, patientId: true } },
          doctor: { select: { name: true, email: true, role: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAppointmentsForDateRange(
    tenantId: string | null,
    startDateStr: string,
    endDateStr: string,
  ): Promise<Appointment[]> {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const where: any = {
      date: { gte: startDate, lte: endDate },
    };

    if (tenantId) where.tenantId = tenantId;

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true, email: true, patientId: true } },
        doctor: { select: { name: true, doctorProfile: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { name: true, phone: true, patientId: true, photoUrl: true, email: true } },
        doctor: { select: { name: true, email: true, role: true, doctorProfile: true } },
        createdByUser: { select: { name: true, email: true } },
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    try {
      const updateData: Record<string, any> = {};

      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.cancelledReason !== undefined) {
        updateData.cancelledReason = dto.cancelledReason;
      }

      return await this.prisma.appointment.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw new NotFoundException('Appointment not found');
    }
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateStatusDto,
  ): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status as AppointmentStatus,
        cancelledReason: dto.cancelledReason,
      },
    });
  }

  async cancel(
    tenantId: string,
    id: string,
    reason?: string,
  ): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED, cancelledReason: reason },
    });
  }

  async getTodayAppointments(tenantId: string) {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        patient: { select: { name: true, phone: true, patientId: true } },
        doctor: { select: { name: true, email: true } },
      },
      orderBy: [{ doctorId: 'asc' }, { startTime: 'asc' }],
    });

    // Group by doctor
    const grouped: Record<string, Appointment[]> = {};
    for (const appt of appointments) {
      const doctorId = appt.doctorId;
      if (!grouped[doctorId]) grouped[doctorId] = [];
      grouped[doctorId].push(appt);
    }
    return grouped;
  }

  // ─── Doctor Leave ──────────────────────────────────────────────────────────
  async createDoctorLeave(
    tenantId: string,
    dto: CreateDoctorLeaveDto,
  ): Promise<DoctorLeave> {
    const date = new Date(dto.date);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.prisma.doctorLeave.findFirst({
      where: {
        tenantId,
        doctorId: dto.doctorId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });
    if (existing)
      throw new ConflictException(
        'Leave already exists for this doctor on this date',
      );

    return this.prisma.doctorLeave.create({
      data: {
        tenantId,
        doctorId: dto.doctorId,
        date,
        reason: dto.reason,
      },
    });
  }

  async getDoctorLeaves(tenantId: string, doctorId?: string) {
    const where: any = { tenantId };
    if (doctorId) where.doctorId = doctorId;
    return this.prisma.doctorLeave.findMany({
      where,
      include: {
        doctor: { select: { name: true, email: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async deleteDoctorLeave(tenantId: string, id: string): Promise<void> {
    try {
      await this.prisma.doctorLeave.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Doctor leave not found');
    }
  }
}
