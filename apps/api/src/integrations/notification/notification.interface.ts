export interface NotificationPayload {
  to: string;
  message: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface IvrCallPayload {
  to: string;
  promptCode: string;
  language?: string;
}

export interface UssdSessionPayload {
  sessionId: string;
  phoneNumber: string;
  text: string;
}

export interface NotificationDeliveryReceipt {
  success: boolean;
  messageId: string;
  timestamp: Date;
  channel: 'SMS' | 'IVR' | 'USSD';
  provider: string;
  rawStatus?: string;
}

/**
 * Interface contract for external communication providers (SMS, IVR, USSD).
 * Production implementations (e.g. Twilio, Gupshup, CDAC, etc.) will fulfill this interface.
 */
export interface NotificationProvider {
  sendSms(payload: NotificationPayload): Promise<NotificationDeliveryReceipt>;
  initiateIvrCall(payload: IvrCallPayload): Promise<NotificationDeliveryReceipt>;
  handleUssdRequest(payload: UssdSessionPayload): Promise<NotificationDeliveryReceipt>;
}

export const NOTIFICATION_PROVIDER_TOKEN = Symbol('NOTIFICATION_PROVIDER_TOKEN');
