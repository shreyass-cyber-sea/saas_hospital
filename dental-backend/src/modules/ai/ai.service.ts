import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly modelName = 'gemini-2.5-flash';

  constructor(
    private configService: ConfigService,
    private tenantService: TenantService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI features will be disabled or fallback responses will be used.',
      );
    }
  }

  async generateReply(
    tenantId: string,
    patientMessage: string,
    sessionContext: Record<string, any> = {},
  ): Promise<string> {
    try {
      const tenant = await this.tenantService.getTenantById(tenantId);
      if (!tenant) throw new Error('Tenant not found');

      const clinicName = tenant.name || 'our clinic';
      const clinicPhone = tenant.phone || 'our main number';
      let clinicAddress = 'our clinic location';
      if (tenant.address && typeof tenant.address === 'object' && 'street' in tenant.address) {
        clinicAddress = (tenant.address as any).street;
      }

      // Format working hours (simplified for prompt)
      const settings = tenant.settings as any;
      const hoursList = settings?.workingHours
        ? settings.workingHours
          .map(
            (h) =>
              `${h.day}: ${h.isClosed ? 'Closed' : `${h.startTime}-${h.endTime}`}`,
          )
          .join(', ')
        : '9 AM to 6 PM';

      const systemPrompt = `
You are a friendly and professional dental clinic receptionist assistant 
for ${clinicName} located at ${clinicAddress}. 
Your job: help patients with appointment info, dental FAQs, clinic details.
Clinic hours: ${hoursList}.
Rules: 
- Never diagnose medical conditions
- Keep replies under 120 words
- Be warm, friendly, professional
- For emergencies: advise calling clinic immediately at ${clinicPhone || 'our main number'}
- If unsure, say our team will help during clinic hours
- End with a helpful suggestion when appropriate
Patient context: ${JSON.stringify(sessionContext)}`;

      if (!this.genAI) {
        return `Our team will be happy to help you during clinic hours. Please call us or visit us! 😊`;
      }

      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: patientMessage }] }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
      });

      return result.response.text();
    } catch (error) {
      this.logger.error(`Error generating AI reply: ${error.message}`);
      // Fallback response strictly adhered to as per prompt
      return `Our team will be happy to help you during clinic hours. Please call us or visit us! 😊`;
    }
  }

  // TODO: integrate with patient and clinical notes
  async generatePatientSummary(
    tenantId: string,
    patientId: string,
  ): Promise<string> {
    if (!this.genAI) {
      return 'AI features are currently unavailable.';
    }

    // Here we will call the Patients/Notes services when we merge with Person 2
    // For now, this is a placeholder implementation that demonstrates the call
    const prompt = `Generate a clinical summary paragraph for patient ID ${patientId}. Note: Full patient clinical data integration is pending.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.logger.error(`Error generating patient summary: ${error.message}`);
      throw new Error('Failed to generate summary');
    }
  }
}
