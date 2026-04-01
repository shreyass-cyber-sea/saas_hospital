import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { PatientSummaryDto } from './dto/patient-summary.dto';
import { ChatTestDto } from './dto/chat-test.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { GetTenant } from '../../common/decorators/get-tenant.decorator';

@ApiTags('AI Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('patient-summary')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Generates a clinical summary for a patient (Admin/Doctor only)',
  })
  async generateSummary(
    @GetTenant() tenantId: string,
    @Body() body: PatientSummaryDto,
  ) {
    try {
      const summary = await this.aiService.generatePatientSummary(
        tenantId,
        body.patientId,
      );
      return { summary };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chat-test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tests the Gemini reception AI bot (Admin only)' })
  async testChat(@GetTenant() tenantId: string, @Body() body: ChatTestDto) {
    // Typically the bot will be tested with the tenantId from the user, but testing allows arbitrary tenants
    const targetTenantId = body.tenantId || tenantId;
    try {
      const reply = await this.aiService.generateReply(
        targetTenantId,
        body.message,
        {}, // Empty session context for basic test
      );
      return { reply };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate test reply',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
