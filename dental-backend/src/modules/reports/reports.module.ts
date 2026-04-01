import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Invoice, InvoiceSchema } from '../billing/invoice.schema';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/appointment.schema';
import { Patient, PatientSchema } from '../patients/patient.schema';
import {
  StockTransaction,
  StockTransactionSchema,
  InventoryItem,
  InventoryItemSchema,
  LabCase,
  LabCaseSchema,
} from '../inventory/inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: StockTransaction.name, schema: StockTransactionSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: LabCase.name, schema: LabCaseSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
