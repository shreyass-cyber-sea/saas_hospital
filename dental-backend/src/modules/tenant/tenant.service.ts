import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async createTenant(clinicName: string, email: string, phone?: string): Promise<Tenant> {
    const slug = this.generateSlug(clinicName);
    return this.prisma.tenant.create({
      data: {
        name: clinicName,
        slug,
        email,
        phone: phone || '',
        settings: {
          workingHours: { start: '09:00', end: '20:00' },
          workingDays: [0, 1, 2, 3, 4, 5],
          appointmentDuration: 30,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      },
    });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getTenantById(id: string): Promise<Tenant> {
    return this.findById(id);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async update(id: string, dto: Partial<Tenant>): Promise<Tenant> {
    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: dto as any,
      });
    } catch (error) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() +
      '-' +
      Date.now().toString(36)
    );
  }
}
