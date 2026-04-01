import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMode } from './invoice.schema';

export class LineItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() procedureId?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ default: 1 }) @IsNumber() @Min(1) quantity: number = 1;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;
  @ApiPropertyOptional({ default: 18 })
  @IsOptional()
  @IsNumber()
  taxPercent?: number;
}

export class CreateInvoiceDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appointmentId?: string;
  @ApiProperty() @IsString() doctorId: string;
  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  advanceUsed?: number;
}

export class RecordPaymentDto {
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiProperty({ enum: PaymentMode }) @IsEnum(PaymentMode) mode: PaymentMode;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}
