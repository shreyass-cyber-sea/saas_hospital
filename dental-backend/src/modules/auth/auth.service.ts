import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { Role } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private tenantService: TenantService,
  ) { }

  async registerTenant(registerDto: RegisterDto) {
    const { clinicName, userName, email, phone, supabaseUserId } = registerDto;
    if (!supabaseUserId) {
      throw new BadRequestException('Missing Supabase user id for registration.');
    }

    const userExists = await this.usersService.checkEmailExists(email);
    if (userExists) {
      throw new ConflictException('Email already in use.');
    }

    const tenant = await this.tenantService.createTenant(clinicName, email, phone);
    
    const user = await this.usersService.create(tenant.id, {
      id: supabaseUserId, // Link to Supabase Auth ID
      name: userName || 'Admin',
      email,
      role: Role.ADMIN,
    });

    return {
      message: 'Clinic registered successfully',
      tenant: { name: tenant.name, slug: tenant.slug },
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async login(loginDto: LoginDto) {
    // With Supabase Auth, the 'login' endpoint on the backend 
    // is primarily for syncing/returning the user profile from our DB 
    // after the frontend is already authenticated with Supabase.
    try {
      const user = await this.usersService.findByEmailForAuth(loginDto.email);
      
      if (!user) {
        throw new NotFoundException('User profile not found. Please register.');
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      };
    } catch (error: any) {
      this.logger.error(`Login/Sync Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Admin creates a new user (doctor, receptionist, etc.) within their tenant.
   */
  async createUser(tenantId: string, dto: CreateUserDto) {
    if (!dto.supabaseUserId) {
      throw new BadRequestException('Missing Supabase user id for the new user.');
    }

    const userExists = await this.usersService.checkEmailExists(dto.email);
    if (userExists) throw new ConflictException('Email already in use.');

    return this.usersService.create(tenantId, {
      id: dto.supabaseUserId,
      name: dto.name,
      email: dto.email,
      role: dto.role as Role,
      doctorProfile: dto.doctorProfile as any,
    });
  }

  /**
   * Returns the profile of the currently logged-in user.
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
