import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiRequest } from "./apiClient";
import { FinFlowNotification } from "../types/finflow";

type NotificationsResponse = {
  notifications: FinFlowNotification[];
};

type NotificationResponse = {
  notification: FinFlowNotification | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function fetchNotifications(status?: "pending" | "read") {
  const query = status ? `?status=${status}` : "";
  return (await apiRequest<NotificationsResponse>(`/notifications${query}`, { requireAuth: true })).notifications;
}

export async function markNotificationReadApi(id: string) {
  return (await apiRequest<NotificationResponse>(`/notifications/${id}/read`, { method: "PATCH", requireAuth: true })).notification;
}

export async function markAllNotificationsReadApi() {
  await apiRequest<{ ok: boolean }>("/notifications/read-all", { method: "PATCH", requireAuth: true });
}

export async function snoozeNotificationApi(id: string) {
  return (await apiRequest<NotificationResponse>(`/notifications/${id}/snooze`, { method: "POST", requireAuth: true })).notification;
}

export async function completeNotificationApi(id: string) {
  return (await apiRequest<NotificationResponse>(`/notifications/${id}/complete`, { method: "POST", requireAuth: true })).notification;
}

export async function registerExpoPushToken() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      importance: Notifications.AndroidImportance.HIGH,
      name: "FinFlow"
    });
  }
  if (!Device.isDevice) return { registered: false, reason: "Push real requiere un dispositivo físico." };
  const current = await Notifications.getPermissionsAsync();
  const final = current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
  if (final.status !== "granted") return { registered: false, reason: "Permiso de push no concedido." };
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await apiRequest<{ ok: boolean }>("/devices/push-token", { body: { platform: Platform.OS, token }, method: "POST", requireAuth: true });
  return { registered: true, token };
}

export async function requestPaymentNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  return current.status === "granted" ? current : Notifications.requestPermissionsAsync();
}

export async function scheduleLocalPaymentNotifications(input: {
  title: string;
  body: string;
  dueDate: string;
  reminderDaysBefore: number;
  data?: Record<string, unknown>;
}) {
  const permission = await requestPaymentNotificationPermission();
  if (permission.status !== "granted") return { scheduled: false };
  const due = new Date(input.dueDate);
  due.setHours(9, 0, 0, 0);
  const reminder = new Date(due);
  reminder.setDate(reminder.getDate() - input.reminderDaysBefore);
  const now = new Date();
  const ids: string[] = [];
  for (const triggerDate of [reminder, due]) {
    if (triggerDate <= now) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: { body: input.body, data: input.data || {}, title: input.title },
      trigger: triggerDate as any
    });
    ids.push(id);
  }
  return { ids, scheduled: ids.length > 0 };
}

export async function unregisterExpoPushToken(token: string) {
  await apiRequest<{ ok: boolean }>("/devices/push-token", { body: { platform: Platform.OS, token }, method: "DELETE", requireAuth: true });
}
