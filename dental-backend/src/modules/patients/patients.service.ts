import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Patient, ClinicalNote, PatientDocument, Gender } from '@prisma/client';
import {
  CreatePatientDto,
  UpdatePatientDto,
  AddClinicalNoteDto,
  AddDocumentDto,
} from './dto/patient.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private prisma: PrismaService,
  ) { }

  // ─── Patient ID Generation ─────────────────────────────────────────────────
  /**
   * Auto-generates unique patient ID per tenant in format:
   * TenantPrefix-YYYY-NNNN (e.g. CLN-2024-0001)
   */
  private async generatePatientId(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count({
      where: { tenantId },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `CLN-${year}-${seq}`;
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  async create(
    tenantId: string,
    userId: string,
    dto: CreatePatientDto,
  ): Promise<Patient> {
    const patientId = await this.generatePatientId(tenantId);
    return this.prisma.patient.create({
      data: {
        ...(dto as any),
        tenantId,
        patientId,
        firstVisit: new Date(),
        createdByUserId: userId,
      },
    });
  }

  async findAll(tenantId: string, pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { patientId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({
      where: { id },
    });
  }

  async searchPatients(tenantId: string, query: string): Promise<Partial<Patient>[]> {
    return this.prisma.patient.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { patientId: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        patientId: true,
        lastVisit: true,
      },
      take: 10,
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePatientDto,
  ): Promise<Patient> {
    try {
      return await this.prisma.patient.update({
        where: { id },
        data: dto as any,
      });
    } catch (error) {
      throw new NotFoundException('Patient not found');
    }
  }

  // ─── History & Appointments ─────────────────────────────────────────────────
  async getHistory(tenantId: string, patientId: string) {
    const patient = await this.findOne(tenantId, patientId);
    const notes = await this.prisma.clinicalNote.findMany({
      where: { tenantId, patientId },
      include: {
        patient: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { patient, notes };
  }

  async getAppointments(
    tenantId: string,
    patientId: string,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { tenantId, patientId },
        include: {
          doctor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({
        where: { tenantId, patientId },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Clinical Notes ─────────────────────────────────────────────────────────
  async addNote(
    tenantId: string,
    patientId: string,
    userId: string,
    dto: AddClinicalNoteDto,
  ): Promise<ClinicalNote> {
    await this.findOne(tenantId, patientId);

    const note = await this.prisma.clinicalNote.create({
      data: {
        chiefComplaint: dto.chiefComplaint,
        findings: dto.clinicalFindings,
        diagnosis: dto.diagnosis,
        treatmentPlan: dto.treatmentPlan,
        vitals: {} as any,
        prescriptions: dto.prescriptions as any || [],
        tenantId,
        patientId,
        doctorId: dto.doctorId || userId,
      },
    });

    // Update patient's lastVisit and totalVisits
    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        lastVisit: new Date(),
        totalVisits: { increment: 1 },
      },
    });

    return note;
  }

  async getNotes(
    tenantId: string,
    patientId: string,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.clinicalNote.findMany({
        where: { tenantId, patientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.clinicalNote.count({
        where: { tenantId, patientId },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateNote(
    tenantId: string,
    patientId: string,
    noteId: string,
    dto: Partial<AddClinicalNoteDto>,
  ): Promise<ClinicalNote> {
    try {
      return await this.prisma.clinicalNote.update({
        where: { id: noteId },
        data: dto as any,
      });
    } catch (error) {
      throw new NotFoundException('Clinical note not found');
    }
  }

  // ─── Documents ─────────────────────────────────────────────────────────────
  async addDocument(
    tenantId: string,
    patientId: string,
    userId: string,
    dto: AddDocumentDto,
  ): Promise<PatientDocument> {
    await this.findOne(tenantId, patientId);

    return this.prisma.patientDocument.create({
      data: {
        name: dto.fileName,
        fileType: dto.fileType,
        fileUrl: dto.fileUrl,
        category: dto.fileType,
        notes: '',
        tenantId,
        patientId,
      },
    });
  }

  async getDocuments(tenantId: string, patientId: string) {
    return this.prisma.patientDocument.findMany({
      where: { tenantId, patientId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
