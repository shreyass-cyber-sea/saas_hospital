import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, AppointmentType } from '../appointment.schema';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient MongoDB ID' })
  @IsMongoId()
  patientId: string;

  @ApiProperty({ description: 'Doctor (User) MongoDB ID' })
  @IsMongoId()
  doctorId: string;

  @ApiPropertyOptional({ description: 'Chair ID e.g. CHAIR-1' })
  @IsOptional()
  @IsString()
  chairId?: string;

  @ApiProperty({ description: 'Date of appointment (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time e.g. 10:30' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time e.g. 11:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration?: number;

  @ApiPropertyOptional({
    enum: AppointmentType,
    default: AppointmentType.CONSULTATION,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Planned procedures', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  procedures?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelledReason?: string;

  @ApiPropertyOptional({ description: 'New chair ID' })
  @IsOptional()
  @IsString()
  chairId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  procedures?: string[];
}

export class UpdateStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}

export class GetSlotsDto {
  @ApiProperty({ description: 'Doctor (User) MongoDB ID' })
  @IsMongoId()
  doctorId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}

export class CreateDoctorLeaveDto {
  @ApiProperty()
  @IsMongoId()
  doctorId: string;

  @ApiProperty({ description: 'Date to block (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
