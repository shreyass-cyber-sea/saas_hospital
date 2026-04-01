import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(tenantId: string, dto: Partial<User>): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...(dto as any),
        tenantId,
      },
    });
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    // Prisma includes all fields by default unless specified otherwise.
    // In SQL, we don't have a hidden 'passwordHash' by default like Mongoose.
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenantId },
    });
  }

  async findDoctorsByTenant(tenantId: string): Promise<Partial<User>[]> {
    // Include both DOCTOR role and ADMIN users who have a doctorProfile
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { role: Role.DOCTOR },
          { role: Role.ADMIN },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        doctorProfile: true,
      },
    });
  }
}
