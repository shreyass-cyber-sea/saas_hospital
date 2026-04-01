import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatTestDto {
  @ApiProperty({
    description: 'The message sent by the patient to test the AI',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'The Tenant ID context for the simulated message',
  })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
