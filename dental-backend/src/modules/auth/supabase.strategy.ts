import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('SUPABASE_JWT_SECRET') || configService.get<string>('JWT_SECRET');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret as string,
    });
  }

  async validate(payload: any) {
    // Supabase standard payload: { sub: UUID, email: string, ... }
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User profile not found in database');
    }

    // Returning user object which will be available as req.user
    // This object includes id, tenantId, and role, required by guards.
    return user;
  }
}
