import { Request } from 'express';

declare module 'express' {
  export interface Request {
    user?: any; // To be extended with actual User type payload
    tenantId?: string;
  }
}
