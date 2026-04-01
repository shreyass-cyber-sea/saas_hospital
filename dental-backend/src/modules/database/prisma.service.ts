import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    } as any);
  }

  async onModuleInit() {
    try {
      console.log('Connecting to database...');
      await this.$connect();
      console.log('Successfully connected to database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      // Not exiting in dev to allow watcher to continue
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
