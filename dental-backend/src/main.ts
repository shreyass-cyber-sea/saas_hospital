import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Serve static files from the 'uploads' directory
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const configService = app.get(ConfigService);

  // CORS — reads FRONTEND_URL env var for production, falls back to localhost
  const frontendUrls = configService
    .get<string>('FRONTEND_URL', 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendUrls,
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['whatsapp/webhook'],
  });

  // Security and Performance Middleware
  app.use(helmet());
  app.use(compression());

  // Lightweight API timing telemetry for key read endpoints.
  const trackedPathPrefixes = [
    '/api/v1/reports/dashboard',
    '/api/v1/appointments',
    '/api/v1/patients',
    '/api/v1/invoices',
  ];
  const timings = new Map<string, number[]>();
  const calcP95 = (values: number[]) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
    return sorted[index];
  };
  app.use((req, res, next) => {
    const route = trackedPathPrefixes.find((prefix) => req.path.startsWith(prefix));
    if (!route) {
      return next();
    }
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const history = timings.get(route) ?? [];
      history.push(durationMs);
      if (history.length > 200) {
        history.shift();
      }
      timings.set(route, history);
      if (history.length % 20 === 0) {
        const p95 = calcP95(history);
        console.log(`[perf] ${route} p95=${p95}ms samples=${history.length}`);
      }
    });
    next();
  });

  // Input Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Configuration
  const options = new DocumentBuilder()
    .setTitle('Dental Clinic SaaS API')
    .setDescription('Multi-tenant API for Clinic Management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);

  // Start Server
  const port = configService.get<number>('port') || 3001;
  await app.listen(port);
  console.log(`Server running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger available at: http://localhost:${port}/api/docs`);
}
bootstrap();
