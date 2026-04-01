import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../modules/database/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const activated = await super.canActivate(context);
            if (activated) {
                const request = context.switchToHttp().getRequest();
                if (request.user?.tenantId) {
                    request.tenantId = request.user.tenantId.toString();
                }
                return true;
            }
        } catch {
            // Fall back to Supabase user lookup below.
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        const token =
            typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : null;

        if (!token) {
            throw new UnauthorizedException('Unauthorized');
        }

        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new UnauthorizedException('Supabase auth is not configured on the backend');
        }

        try {
            const response = await axios.get(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: supabaseAnonKey,
                },
            });

            const supabaseUser = response.data;
            const user = await this.prisma.user.findUnique({
                where: { id: supabaseUser.id },
            });

            if (!user) {
                throw new UnauthorizedException('User profile not found in database');
            }

            request.user = user;
            request.tenantId = user.tenantId.toString();
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Unauthorized');
        }
    }
}
