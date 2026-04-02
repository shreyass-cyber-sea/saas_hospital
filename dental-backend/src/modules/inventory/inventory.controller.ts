import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TransactionType } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── Items ────────────────────────────────────────────────────────────────────
  @Post('items')
  @ApiOperation({ summary: 'Add inventory item' })
  createItem(@Request() req: any, @Body() dto: any) {
    return this.inventoryService.createItem(req.tenantId, dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'List items (filter: category, lowStock)' })
  getItems(
    @Request() req: any,
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.getItems(req.tenantId, pagination, {
      category,
      lowStock: lowStock === 'true',
    });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Items where currentStock <= minimumStock' })
  getLowStock(@Request() req: any) {
    return this.inventoryService.getLowStockItems(req.tenantId);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Total inventory value grouped by category' })
  getValuation(@Request() req: any) {
    return this.inventoryService.getInventoryValuation(req.tenantId);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get single inventory item' })
  getItem(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.getItem(req.tenantId, id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update inventory item' })
  updateItem(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateItem(req.tenantId, id, dto);
  }

  // ── Transactions ─────────────────────────────────────────────────────────────
  @Post('transactions')
  @ApiOperation({
    summary: 'Record stock movement (purchase, usage, adjustment)',
  })
  createTransaction(
    @Request() req: any,
    @Body()
    dto: {
      itemId: string;
      type: TransactionType;
      quantity: number;
      unitCost?: number;
      referenceNote?: string;
      patientId?: string;
    },
  ) {
    return this.inventoryService.createTransaction(
      req.tenantId,
      req.user.sub,
      dto,
    );
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'List stock transactions (filter: itemId, type, date range)',
  })
  getTransactions(
    @Request() req: any,
    @Query() pagination: PaginationDto,
    @Query('itemId') itemId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inventoryService.getTransactions(req.tenantId, pagination, {
      itemId,
      type,
      from,
      to,
    });
  }

  // ── Lab Cases ─────────────────────────────────────────────────────────────────
  @Post('lab-cases')
  @ApiOperation({ summary: 'Create lab case' })
  createLabCase(@Request() req: any, @Body() dto: any) {
    return this.inventoryService.createLabCase(req.tenantId, dto);
  }

  @Get('lab-cases')
  @ApiOperation({ summary: 'List lab cases (filter: status, doctorId)' })
  getLabCases(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.inventoryService.getLabCases(req.tenantId, {
      status,
      doctorId,
    });
  }

  @Get('lab-cases/pending')
  @ApiOperation({ summary: 'Lab cases not yet returned (SENT or IN_PROGRESS)' })
  getPendingLabCases(@Request() req: any) {
    return this.inventoryService.getPendingLabCases(req.tenantId);
  }

  @Patch('lab-cases/:id')
  @ApiOperation({ summary: 'Update lab case status or return date' })
  updateLabCase(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.inventoryService.updateLabCase(req.tenantId, id, dto);
  }
}
