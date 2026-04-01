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
