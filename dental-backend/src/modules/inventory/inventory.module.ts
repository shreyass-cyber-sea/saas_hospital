import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import {
  InventoryItem,
  InventoryItemSchema,
  StockTransaction,
  StockTransactionSchema,
  LabCase,
  LabCaseSchema,
} from './inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: StockTransaction.name, schema: StockTransactionSchema },
      { name: LabCase.name, schema: LabCaseSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
