import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WaSenderUtil {
  private readonly logger = new Logger(WaSenderUtil.name);

  constructor(private configService: ConfigService) { }

  private getCredentials() {
    const rawToken = this.configService.get<string>('WATI_ACCESS_TOKEN') || '';
    const watiApiEndpoint = this.configService.get<string>('WATI_API_ENDPOINT') || '';
    const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    return { token, watiApiEndpoint };
  }

  private formatPhone(to: string): string {
    return to.startsWith('+') ? to.slice(1) : to;
  }

  // ─── Plain text message ────────────────────────────────────────────────────
  async sendTextMessage(to: string, body: string): Promise<void> {
    const { token, watiApiEndpoint } = this.getCredentials();
    if (!body?.trim()) { this.logger.error('Cannot send empty message'); return; }

    const phone = this.formatPhone(to);
    const url = `${watiApiEndpoint}/api/v1/sendSessionMessage/${phone}?messageText=${encodeURIComponent(body)}`;

    try {
      const response = await axios.post(url, {}, { headers: { 'Content-Type': 'application/json', Authorization: token } });
      this.logger.log(`Message sent to ${phone}`);
      this.logger.debug('WATI Response:', JSON.stringify(response.data));
    } catch (error: any) {
      this.logger.error(`Failed to send message to ${to}: ${error.message}`);
      if (error.response?.data) this.logger.error('WATI Error:', JSON.stringify(error.response.data));
      throw error;
    }
  }

  // ─── Numbered text menu (replaces interactive buttons — not available on this WATI plan) ─
  async sendQuickReplyButtons(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    _headerText?: string,
    _footerText?: string,
  ): Promise<void> {
    // Always use plain numbered text — interactive buttons 404 on this plan
    const numbered = buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
    await this.sendTextMessage(to, `${bodyText}\n\n${numbered}`);
  }

  // ─── List Message — Numbered text menu (replaces interactive lists) ─────────
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sectionTitle: string,
    rows: { id: string; title: string; description?: string }[],
    headerText?: string,
    footerText?: string,
  ): Promise<void> {
    // Always use plain numbered text — interactive lists 404 on this WATI plan
    const numbered = rows
      .map((r, i) => `${i + 1}. ${r.title}${r.description ? ` (${r.description})` : ''}`)
      .join('\n');

    // Add back button for non-main-menus (main menu has Help/FAQ as option 5)
    const isMainMenu = rows.some((r) => r.title.includes('Help / FAQ'));
    const backOption = isMainMenu ? '' : `\n0. ↩️ Back`;

    await this.sendTextMessage(
      to,
      `${bodyText}\n\n${numbered}${backOption}\n\nReply with a number to choose.`,
    );
  }

  // ─── Legacy: send as numbered text (kept for backward compat) ─────────────
  async sendInteractiveButtons(
    to: string,
    message: string,
    buttons: { id: string; title: string }[],
  ): Promise<void> {
    if (buttons.length <= 3) {
      await this.sendQuickReplyButtons(to, message, buttons);
    } else {
      await this.sendListMessage(
        to,
        message,
        'View options',
        'Options',
        buttons.map(b => ({ id: b.id, title: b.title })),
      );
    }
  }

  // ─── Template message ─────────────────────────────────────────────────────
  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: { name: string; value: string }[],
  ): Promise<void> {
    const { token, watiApiEndpoint } = this.getCredentials();
    const phone = this.formatPhone(to);

    try {
      await axios.post(
        `${watiApiEndpoint}/api/v1/sendTemplateMessage`,
        { whatsappNumber: phone, template_name: templateName, broadcast_name: templateName, parameters },
        { headers: { 'Content-Type': 'application/json', Authorization: token } },
      );
      this.logger.log(`Template message "${templateName}" sent to ${phone}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send template message to ${to}: ${msg}`);
      throw error;
    }
  }
}
