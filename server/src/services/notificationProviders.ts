import { DeviceToken } from "../models/DeviceToken";
import { env } from "../config/env";

export type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export interface NotificationChannelProvider {
  send(payload: NotificationPayload): Promise<void>;
}

export class InAppNotificationProvider implements NotificationChannelProvider {
  async send(_payload: NotificationPayload) {
    return;
  }
}

export class ExpoPushProvider implements NotificationChannelProvider {
  async send(payload: NotificationPayload) {
    const tokens = await DeviceToken.find({ userId: payload.userId, active: true });
    if (!tokens.length) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      body: JSON.stringify(
        tokens.map((device) => ({
          to: device.token,
          title: payload.title,
          body: payload.message,
          data: payload.metadata || {}
        }))
      ),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    }).catch(() => undefined);
  }
}

export class WhatsAppProvider implements NotificationChannelProvider {
  async send(payload: NotificationPayload) {
    if (!env.whatsapp.enabled || !env.whatsapp.accessToken || !env.whatsapp.phoneNumberId || !payload.metadata?.phoneNumber) return;
    await fetch(`https://graph.facebook.com/v19.0/${env.whatsapp.phoneNumberId}/messages`, {
      body: JSON.stringify({
        messaging_product: "whatsapp",
        template: {
          language: { code: "es" },
          name: env.whatsapp.paymentReminderTemplate
        },
        to: payload.metadata.phoneNumber,
        type: "template"
      }),
      headers: { Authorization: `Bearer ${env.whatsapp.accessToken}`, "Content-Type": "application/json" },
      method: "POST"
    }).catch(() => undefined);
    return;
  }
}
