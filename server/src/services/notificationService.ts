import { Types } from "mongoose";
import { CreditCard } from "../models/CreditCard";
import { DeviceToken } from "../models/DeviceToken";
import { Notification } from "../models/Notification";
import { RecurringPayment } from "../models/RecurringPayment";
import { ExpoPushProvider, InAppNotificationProvider } from "./notificationProviders";

function idOf(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? value.toString() : String(value || "");
}

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : null;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(9, 0, 0, 0);
  return next;
}

function notificationDTO(notification: InstanceType<typeof Notification>) {
  return {
    id: idOf(notification._id),
    userId: idOf(notification.userId),
    user_id: idOf(notification.userId),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    status: notification.status,
    priority: notification.priority,
    readAt: iso(notification.readAt),
    read_at: iso(notification.readAt),
    scheduledFor: iso(notification.scheduledFor),
    scheduled_for: iso(notification.scheduledFor),
    relatedEntityType: notification.relatedEntityType,
    related_entity_type: notification.relatedEntityType,
    relatedEntityId: idOf(notification.relatedEntityId),
    related_entity_id: idOf(notification.relatedEntityId),
    actionType: notification.actionType,
    action_type: notification.actionType,
    metadata: notification.metadata || {},
    createdAt: iso(notification.createdAt),
    created_at: iso(notification.createdAt)
  };
}

async function createIfMissing(input: {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledFor: Date;
  relatedEntityType: string;
  relatedEntityId: Types.ObjectId;
  actionType: string;
  metadata?: Record<string, unknown>;
}) {
  const dedupeKey = `${input.type}:${input.relatedEntityType}:${input.relatedEntityId}:${dayKey(input.scheduledFor)}`;
  const notification = await Notification.findOneAndUpdate(
    { userId: input.userId, dedupeKey },
    {
      $setOnInsert: {
        actionType: input.actionType,
        dedupeKey,
        message: input.message,
        metadata: input.metadata || {},
        priority: input.priority || "normal",
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        scheduledFor: input.scheduledFor,
        status: "pending",
        title: input.title,
        type: input.type,
        userId: input.userId
      }
    },
    { new: true, upsert: true }
  );
  if (notification.createdAt.getTime() === notification.updatedAt.getTime()) {
    await new InAppNotificationProvider().send({ message: input.message, metadata: input.metadata, title: input.title, userId: idOf(input.userId) });
    if (input.priority === "urgent" || input.priority === "high") {
      await new ExpoPushProvider().send({ message: input.message, metadata: input.metadata, title: input.title, userId: idOf(input.userId) });
    }
  }
  return notification;
}

export async function generateNotificationsForUser(userId: Types.ObjectId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);
  const threeDays = addDays(today, 3);
  const [payments, cards] = await Promise.all([RecurringPayment.find({ userId, status: { $ne: "rejected" } }), CreditCard.find({ userId })]);

  for (const payment of payments) {
    const due = new Date(payment.nextChargeDate);
    due.setHours(9, 0, 0, 0);
    if (dayKey(due) === dayKey(tomorrow)) {
      await createIfMissing({
        actionType: "open_payment",
        message: `$U ${payment.amount.toLocaleString("es-UY")} · Vence el ${due.toLocaleDateString("es-UY", { day: "numeric", month: "long" })}`,
        priority: "high",
        relatedEntityId: payment._id,
        relatedEntityType: "payment",
        scheduledFor: due,
        title: `Mañana vence ${payment.merchant}`,
        type: "bill_due_tomorrow",
        userId
      });
    } else if (due < today) {
      await createIfMissing({
        actionType: "open_payment",
        message: `Venció el ${due.toLocaleDateString("es-UY", { day: "numeric", month: "long" })}`,
        priority: "urgent",
        relatedEntityId: payment._id,
        relatedEntityType: "payment",
        scheduledFor: due,
        title: `Todavía no pagaste ${payment.merchant}`,
        type: "bill_overdue",
        userId
      });
    }
  }

  for (const card of cards) {
    const closing = new Date(card.closingDate);
    const due = new Date(card.dueDate);
    if (dayKey(closing) === dayKey(threeDays)) {
      await createIfMissing({
        actionType: "open_card",
        message: `Tenés $U ${card.used.toLocaleString("es-UY")} acumulados`,
        priority: "normal",
        relatedEntityId: card._id,
        relatedEntityType: "card",
        scheduledFor: closing,
        title: "Tu tarjeta cierra en 3 días",
        type: "card_closing",
        userId
      });
    }
    if (dayKey(due) === dayKey(tomorrow)) {
      await createIfMissing({
        actionType: "open_card",
        message: `Pago estimado $U ${card.nextPaymentAmount.toLocaleString("es-UY")}`,
        priority: "high",
        relatedEntityId: card._id,
        relatedEntityType: "card",
        scheduledFor: due,
        title: `Mañana vence ${card.name}`,
        type: "card_due",
        userId
      });
    }
  }
}

export async function listNotifications(userId: Types.ObjectId, status?: string) {
  await generateNotificationsForUser(userId);
  const query: Record<string, unknown> = { userId };
  if (status === "pending" || status === "read") query.status = status;
  const notifications = await Notification.find(query).sort({ status: 1, scheduledFor: 1, createdAt: -1 }).limit(80);
  return notifications.map(notificationDTO);
}

export async function markNotificationRead(userId: Types.ObjectId, id: string) {
  const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { readAt: new Date(), status: "read" }, { new: true });
  return notification ? notificationDTO(notification) : null;
}

export async function markAllNotificationsRead(userId: Types.ObjectId) {
  await Notification.updateMany({ userId, status: "pending" }, { readAt: new Date(), status: "read" });
}

export async function snoozeNotification(userId: Types.ObjectId, id: string) {
  const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { scheduledFor: addDays(new Date(), 1), status: "snoozed" }, { new: true });
  return notification ? notificationDTO(notification) : null;
}

export async function completeNotification(userId: Types.ObjectId, id: string) {
  const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { readAt: new Date(), status: "completed" }, { new: true });
  return notification ? notificationDTO(notification) : null;
}

export async function registerDeviceToken(userId: Types.ObjectId, input: { token: string; platform: string }) {
  await DeviceToken.findOneAndUpdate(
    { token: input.token, userId },
    { active: true, lastUsedAt: new Date(), platform: input.platform, token: input.token, userId },
    { new: true, upsert: true }
  );
}

export async function deactivateDeviceToken(userId: Types.ObjectId, token: string) {
  await DeviceToken.updateMany({ token, userId }, { active: false, lastUsedAt: new Date() });
}
