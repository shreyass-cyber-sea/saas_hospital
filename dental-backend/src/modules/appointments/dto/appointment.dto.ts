import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  ROUTINE_CHECK = 'ROUTINE_CHECK',
  PROCEDURE = 'PROCEDURE',
}

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'Start time (HH:MM)' })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Appointment type' })
  @IsOptional()
  @IsString()
  type?: AppointmentType | string;

  @ApiPropertyOptional({ description: 'Chief complaint' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: AppointmentStatus, description: 'Status' })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}

export class CreateDoctorLeaveDto {
  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Leave date (YYYY-MM-DD)' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ description: 'Reason for leave' })
  @IsOptional()
  @IsString()
  reason?: string;
}