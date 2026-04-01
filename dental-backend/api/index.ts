import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let cachedServer: any;

export const createServer = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();

  await app.init();
  return server;
};

export default async (req: any, res: any) => {
  if (!cachedServer) {
    cachedServer = await createServer();
  }
  cachedServer(req, res);
};
