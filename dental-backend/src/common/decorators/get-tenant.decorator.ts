import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId; // Expected to be set by AuthGuard or Middleware
  },
);
