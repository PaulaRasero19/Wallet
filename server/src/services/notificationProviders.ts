import { DeviceToken } from "../models/DeviceToken";

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
  async send(_payload: NotificationPayload) {
    return;
  }
}
