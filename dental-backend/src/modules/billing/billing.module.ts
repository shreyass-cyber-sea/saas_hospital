import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PdfService } from './pdf.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    StorageModule,
    NotificationsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, PdfService],
  exports: [BillingService],
})
export class BillingModule {}
