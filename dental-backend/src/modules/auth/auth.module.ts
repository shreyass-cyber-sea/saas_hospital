import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseStrategy } from './supabase.strategy';
import { UsersModule } from '../users/users.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    UsersModule,
    TenantModule,
    PassportModule,
  ],
  providers: [AuthService, SupabaseStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
