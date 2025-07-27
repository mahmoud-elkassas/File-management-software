export interface SMSMessage {
  to: string;
  message: string;
  status: "sent" | "failed" | "duplicate";
  deliveryStatus: "delivered" | "failed";
  sentAt: string;
  error?: string;
}

export interface SMSResult {
  success: boolean;
  error?: string;
  messageId?: string;
  isDuplicate?: boolean;
}

export interface Person {
  id?: number;
  name: string;
  phone?: string;
  list_number: string;
}

export class SMSService {
  constructor();
  sendSMS(to: string, message: string): Promise<SMSResult>;
  sendStatusNotification(person: Person): Promise<SMSResult>;
  getMessageHistory(): SMSMessage[];
}
