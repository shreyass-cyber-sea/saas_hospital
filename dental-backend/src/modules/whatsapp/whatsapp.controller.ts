import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  ForbiddenException,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import type { Request, Response } from 'express';

@ApiTags('WhatsApp Webhook')
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private configService: ConfigService,
    private whatsappService: WhatsappService,
  ) { }

  @Get('webhook')
  @ApiOperation({ summary: 'Verification endpoint for Meta Webhook setup' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.configService.get<string>(
      'WHATSAPP_VERIFY_TOKEN',
    );

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    throw new ForbiddenException('Invalid verification token');
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Receives incoming messages from WhatsApp (Meta API or WATI)',
  })
  async handleIncomingMessage(@Req() req: Request, @Res() res: Response) {
    // 1. Immediately acknowledge receipt to prevent retries
    res.status(200).send('EVENT_RECEIVED');

    const body = req.body;
    this.logger.debug('Webhook received:', JSON.stringify(body));

    try {
      // Handle WATI webhook format
      if (body.eventType === 'message' && body.waId) {
        const from = body.waId;
        const senderName: string = body.senderName || '';

        // Extract message from all possible payload types:
        // 1. interactiveButtonReply — user tapped a Quick Reply button → use button id
        // 2. listReply             — user selected from a List Message → use row id
        // 3. text                  — user typed a plain text message
        const messageBody: string =
          body.interactiveButtonReply?.id    // quick reply button tapped
          || body.listReply?.id              // list item selected
          || body.text
          || '';

        const phoneNumberId = this.configService.get<string>('WATI_PHONE_NUMBER') || 'wati';

        // Only process incoming customer messages (owner: false = from user, not business)
        if (body.owner === false) {
          this.logger.debug(
            `Message from ${from} (${senderName}): "${messageBody}" ` +
            `[${body.interactiveButtonReply ? 'ButtonReply' : body.listReply ? 'ListReply' : 'Text'}]`
          );
          setImmediate(() => {
            this.whatsappService
              .processMessage(from, messageBody, phoneNumberId, senderName)
              .catch((err) => {
                this.logger.error(
                  `Error processing WATI webhook message: ${err.message}`,
                  err.stack,
                );
              });
          });
        }
      }
      // Handle Meta/WhatsApp Business API format
      else if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages[0]) {
          const message = messages[0];
          const phoneNumberId = value.metadata?.phone_number_id;
          const from = message.from;
          const messageBody = message.type === 'text' ? message.text.body : '';

          setImmediate(() => {
            this.whatsappService
              .processMessage(from, messageBody, phoneNumberId)
              .catch((err) => {
                this.logger.error(
                  `Error processing Meta webhook message: ${err.message}`,
                  err.stack,
                );
              });
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error parsing webhook payload', errorMessage);
    }
  }
}
