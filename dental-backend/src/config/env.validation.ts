import * as Joi from 'joi';

/**
 * Joi schema that validates all required environment variables on startup.
 * If any required var is missing or fails validation, the application will
 * throw an error before binding to a port — prevents silent misconfiguration.
 */
export const envValidationSchema = Joi.object({
  // ─── Core ─────────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3002),

  // ─── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string().uri().required().messages({
    'any.required': 'DATABASE_URL is required (Prisma direct connection string)',
    'string.uri': 'DATABASE_URL must be a valid postgresql:// URI',
  }),
  DIRECT_URL: Joi.string().uri().optional(),

  // ─── JWT ──────────────────────────────────────────────────────────────────
  JWT_SECRET: Joi.string().min(16).required().messages({
    'any.required': 'JWT_SECRET is required',
    'string.min': 'JWT_SECRET must be at least 16 characters long',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // ─── Supabase ─────────────────────────────────────────────────────────────
  SUPABASE_URL: Joi.string().uri().required().messages({
    'any.required': 'SUPABASE_URL is required',
  }),
  SUPABASE_ANON_KEY: Joi.string().required().messages({
    'any.required': 'SUPABASE_ANON_KEY is required',
  }),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(), // Not currently used in code
}).options({ allowUnknown: true }); // Allow other env vars (PATH, etc.)
