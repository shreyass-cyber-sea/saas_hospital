import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientSummaryDto {
  @ApiProperty({ description: 'Object ID of the patient to summarize' })
  @IsString()
  @IsNotEmpty()
  patientId: string;
}
