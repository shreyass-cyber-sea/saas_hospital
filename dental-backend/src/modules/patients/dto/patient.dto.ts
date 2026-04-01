import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
  IsMongoId,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../patient.schema';

class AddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
}

class EmergencyContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relation?: string;
}

export class CreatePatientDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() phone: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
  @ApiPropertyOptional() @IsOptional() address?: AddressDto;
  @ApiPropertyOptional() @IsOptional() @IsString() bloodGroup?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() medicalHistory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() abhaId?: string;
  @ApiPropertyOptional() @IsOptional() emergencyContact?: EmergencyContactDto;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() whatsappOptIn?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
  @ApiPropertyOptional() @IsOptional() address?: AddressDto;
  @ApiPropertyOptional() @IsOptional() @IsString() bloodGroup?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() medicalHistory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() abhaId?: string;
  @ApiPropertyOptional() @IsOptional() emergencyContact?: EmergencyContactDto;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() whatsappOptIn?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
}

export class AddDocumentDto {
  @ApiProperty() @IsString() fileName: string;
  @ApiProperty({ enum: ['xray', 'report', 'consent', 'other'] })
  @IsString()
  fileType: string;
  @ApiProperty() @IsString() fileUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() appointmentId?: string;
}

export class AddClinicalNoteDto {
  @ApiProperty() @IsMongoId() doctorId: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() appointmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() chiefComplaint?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicalFindings?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() diagnosis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() treatmentDone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() treatmentPlan?: string;
  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  prescriptions?: object[];
  @ApiPropertyOptional() @IsOptional() toothChart?: Record<string, unknown>;
}
