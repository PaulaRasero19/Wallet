import { Types } from "mongoose";
import { CreditCard } from "../models/CreditCard";
import { DeviceToken } from "../models/DeviceToken";
import { InstallmentPurchase } from "../models/InstallmentPurchase";
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

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysUntil(value: Date) {
  return Math.round((startOfDay(value).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
}

function money(amount: number, currency = "UYU") {
  const symbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "$U";
  return `${symbol} ${amount.toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

function naturalReminder(input: { amount: number; currency?: string; dueDate: Date; income?: boolean; installmentNumber?: number; name: string; totalInstallments?: number }) {
  const days = daysUntil(input.dueDate);
  const date = input.dueDate.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
  const subject = input.installmentNumber
    ? `Cuota ${input.installmentNumber} de ${input.totalInstallments} · ${input.name}`
    : input.name;
  const timing = days < 0 ? "está vencido" : days === 0 ? (input.income ? "se espera hoy" : "vence hoy") : days === 1 ? (input.income ? "se espera mañana" : "vence mañana") : days === 7 ? (input.income ? "se espera en una semana" : "vence en una semana") : input.income ? `se espera en ${days} días` : `vence en ${days} días`;
  const title = `${subject} ${timing}`;
  const message = input.income
    ? `Esperás recibir ${money(input.amount, input.currency)} el ${date}.`
    : input.installmentNumber
      ? `${days < 0 ? "Venció" : "Vence"} el ${date} por ${money(input.amount, input.currency)}.`
      : `${days < 0 ? "El pago de" : "Tenés que pagar"} ${money(input.amount, input.currency)} ${days < 0 ? `venció el ${date}` : `el ${date}`}.`;
  return { message, priority: days < 0 ? "urgent" as const : days <= 1 ? "high" as const : days <= 3 ? "normal" as const : "low" as const, title };
}

function reminderKey(input: { dueDate: Date; income?: boolean; offset: number; relatedEntityId: Types.ObjectId; relatedEntityType: "payment" | "installment" }) {
  const type = input.relatedEntityType === "installment" ? "installment_due" : input.income ? "income_reminder" : "payment_reminder";
  return `${type}:${input.relatedEntityType}:${input.relatedEntityId}:${dayKey(input.dueDate)}:reminder-${input.offset}`;
}

async function ensureInternalReminder(input: { amount: number; currency: string; dueDate: Date; income?: boolean; installmentNumber?: number; name: string; offset: number; relatedEntityId: Types.ObjectId; relatedEntityType: "payment" | "installment"; totalInstallments?: number; installmentId?: string; userId: Types.ObjectId }) {
  const due = new Date(input.dueDate);
  due.setHours(9, 0, 0, 0);
  const scheduledFor = addDays(due, -input.offset);
  const copy = naturalReminder({ ...input, dueDate: due });
  const type = input.relatedEntityType === "installment" ? "installment_due" : input.income ? "income_reminder" : "payment_reminder";
  const dedupeKey = reminderKey({ ...input, dueDate: due });
  await Notification.findOneAndUpdate(
    { userId: input.userId, dedupeKey },
    {
      $set: {
        actionType: `open_${input.relatedEntityType}`,
        message: copy.message,
        metadata: { amount: input.amount, currency: input.currency, dueDate: due.toISOString(), installmentId: input.installmentId, installmentNumber: input.installmentNumber, kind: input.income ? "income" : "payment", name: input.name, reminderDaysBefore: input.offset, totalInstallments: input.totalInstallments },
        priority: copy.priority,
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        scheduledFor,
        title: copy.title,
        type
      },
      $setOnInsert: { dedupeKey, status: "pending", userId: input.userId }
    },
    { upsert: true }
  );
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
      $set: {
        actionType: input.actionType,
        message: input.message,
        metadata: input.metadata || {},
        priority: input.priority || "normal",
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        scheduledFor: input.scheduledFor,
        title: input.title,
        type: input.type
      },
      $setOnInsert: {
        dedupeKey,
        status: "pending",
        userId: input.userId
      }
    },
    { new: true, upsert: true }
  );
  if (notification.createdAt.getTime() === notification.updatedAt.getTime()) {
    await new InAppNotificationProvider().send({ message: input.message, metadata: input.metadata, title: input.title, userId: idOf(input.userId) });
    if (input.relatedEntityType !== "payment" && (input.priority === "urgent" || input.priority === "high")) {
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
  const [payments, cards, purchases] = await Promise.all([
    RecurringPayment.find({ userId, status: { $ne: "rejected" }, active: { $ne: false }, notificationsEnabled: { $ne: false } }),
    CreditCard.find({ userId }),
    InstallmentPurchase.find({ userId, status: "active" })
  ]);
  const validReminderKeys: string[] = [];

  for (const payment of payments) {
    const due = new Date(payment.nextChargeDate);
    due.setHours(9, 0, 0, 0);
    validReminderKeys.push(reminderKey({ dueDate: due, income: payment.kind === "income", offset: payment.reminderDaysBefore, relatedEntityId: payment._id, relatedEntityType: "payment" }));
    await ensureInternalReminder({ amount: payment.amount, currency: payment.currency, dueDate: due, income: payment.kind === "income", name: payment.merchant, offset: payment.reminderDaysBefore, relatedEntityId: payment._id, relatedEntityType: "payment", userId });
  }

  for (const purchase of purchases) {
    for (const installment of purchase.installments.filter((item) => item.status === "pending")) {
      validReminderKeys.push(reminderKey({ dueDate: new Date(installment.dueDate), offset: purchase.reminderDaysBefore, relatedEntityId: purchase._id, relatedEntityType: "installment" }));
      await ensureInternalReminder({ amount: installment.amount, currency: purchase.currency, dueDate: installment.dueDate, installmentId: idOf(installment._id), installmentNumber: installment.number, name: purchase.name, offset: purchase.reminderDaysBefore, relatedEntityId: purchase._id, relatedEntityType: "installment", totalInstallments: purchase.totalInstallments, userId });
    }
  }

  await Notification.updateMany(
    { userId, relatedEntityType: { $in: ["payment", "installment"] }, dedupeKey: { $nin: validReminderKeys }, status: { $in: ["pending", "read", "snoozed"] } },
    { $set: { status: "completed" } }
  );

  for (const card of cards) {
    const closing = new Date(card.closingDate);
    const due = new Date(card.dueDate);
    if (dayKey(closing) === dayKey(threeDays)) {
      await createIfMissing({
        actionType: "open_card",
        message: `Te quedan 3 días. Tenés $U ${card.used.toLocaleString("es-UY")} acumulados`,
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
        message: `Te queda 1 día. Pago estimado $U ${card.nextPaymentAmount.toLocaleString("es-UY")}`,
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
  if (status === "pending") {
    query.status = status;
    query.scheduledFor = { $lte: new Date() };
  } else if (status === "read") query.status = status;
  else query.$or = [{ status: { $ne: "pending" } }, { scheduledFor: { $lte: new Date() } }];
  const notifications = await Notification.find(query).limit(80);
  const priority = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  return notifications.sort((a, b) => priority[a.priority] - priority[b.priority] || Number(a.scheduledFor) - Number(b.scheduledFor)).map(notificationDTO);
}

export async function markNotificationRead(userId: Types.ObjectId, id: string) {
  const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { readAt: new Date(), status: "read" }, { new: true });
  return notification ? notificationDTO(notification) : null;
}

export async function markAllNotificationsRead(userId: Types.ObjectId) {
  await Notification.updateMany({ userId, status: "pending", scheduledFor: { $lte: new Date() } }, { readAt: new Date(), status: "read" });
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
