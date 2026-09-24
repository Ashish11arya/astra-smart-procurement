import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  NotificationPayload,
  IvrCallPayload,
  UssdSessionPayload,
  NotificationDeliveryReceipt,
} from './notification.interface';

@Injectable()
export class NotificationStubAdapter implements NotificationProvider {
  private readonly logger = new Logger(NotificationStubAdapter.name);

  async sendSms(payload: NotificationPayload): Promise<NotificationDeliveryReceipt> {
    this.logger.debug(
      `[DEV ADAPTER] SMS invocation stub for recipient: ${payload.to.slice(0, 3)}*** - template: ${payload.templateId || 'n/a'}`,
    );
    return {
      success: true,
      messageId: `stub-sms-${Date.now()}`,
      timestamp: new Date(),
      channel: 'SMS',
      provider: 'DEV_STUB_ADAPTER',
      rawStatus: 'NOT_SENT_STUB_MODE',
    };
  }

  async initiateIvrCall(payload: IvrCallPayload): Promise<NotificationDeliveryReceipt> {
    this.logger.debug(
      `[DEV ADAPTER] IVR call invocation stub for recipient: ${payload.to.slice(0, 3)}*** - prompt: ${payload.promptCode}`,
    );
    return {
      success: true,
      messageId: `stub-ivr-${Date.now()}`,
      timestamp: new Date(),
      channel: 'IVR',
      provider: 'DEV_STUB_ADAPTER',
      rawStatus: 'NOT_SENT_STUB_MODE',
    };
  }

  async handleUssdRequest(payload: UssdSessionPayload): Promise<NotificationDeliveryReceipt> {
    this.logger.debug(`[DEV ADAPTER] USSD session stub for: ${payload.sessionId}`);
    return {
      success: true,
      messageId: `stub-ussd-${Date.now()}`,
      timestamp: new Date(),
      channel: 'USSD',
      provider: 'DEV_STUB_ADAPTER',
      rawStatus: 'NOT_SENT_STUB_MODE',
    };
  }
}
