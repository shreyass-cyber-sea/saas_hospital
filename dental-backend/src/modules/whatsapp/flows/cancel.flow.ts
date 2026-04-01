import { Injectable } from '@nestjs/common';
import { WaSenderUtil } from '../utils/wa-sender.util';

@Injectable()
export class CancelFlow {
  constructor(private waSender: WaSenderUtil) {}

  async handleCancel(phone: string) {
    await this.waSender.sendTextMessage(
      phone,
      `If you need to cancel an appointment, please contact the clinic directly until our automated cancellation is fully activated. Or return to the *Menu* to chat with AI.`,
    );
  }
}
