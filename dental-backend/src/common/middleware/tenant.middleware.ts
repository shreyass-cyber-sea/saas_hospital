import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // For protected routes, tenantId comes from JWT
    if (req.user && req.user.tenantId) {
      req.tenantId = req.user.tenantId;
      return next();
    }

    // For public routes that need tenant context (e.g., patient booking via slug header)
    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    if (tenantIdHeader) {
      req.tenantId = tenantIdHeader;
      return next();
    }

    // We don't throw an error here, as some routes are completely public (e.g. register, login).
    // The guards/decorators will enforce tenantId presence when required.
    next();
  }
}
