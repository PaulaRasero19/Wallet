import { Types } from "mongoose";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { CreditCard } from "../models/CreditCard";
import { Goal } from "../models/Goal";
import { InstallmentPurchase } from "../models/InstallmentPurchase";
import { Notification } from "../models/Notification";
import { PlannerEvent } from "../models/PlannerEvent";
import { RecurringPayment } from "../models/RecurringPayment";
import { Transaction } from "../models/Transaction";
import { AppError } from "../utils/appError";
import { validateExpenseAgainstAvailableBalance } from "./transactionService";

function idOf(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? value.toString() : String(value || "");
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function paymentDTO(payment: InstanceType<typeof RecurringPayment>) {
  return {
    id: idOf(payment._id),
    merchant: payment.merchant,
    category: payment.category,
    amount: payment.amount,
    currency: payment.currency,
    frequency: payment.frequency,
    nextChargeDate: isoDate(payment.nextChargeDate),
    next_charge_date: isoDate(payment.nextChargeDate),
    reminderDaysBefore: payment.reminderDaysBefore,
    reminder_days_before: payment.reminderDaysBefore,
    notificationsEnabled: payment.notificationsEnabled,
    notifications_enabled: payment.notificationsEnabled,
    active: payment.active,
    status: payment.status,
    lastTransactionId: idOf(payment.lastTransactionId),
    last_transaction_id: idOf(payment.lastTransactionId),
    kind: payment.kind,
    confidence: payment.confidence,
    priceChange: payment.priceChange,
    price_change: payment.priceChange,
    duplicateGroup: payment.duplicateGroup,
    duplicate_group: payment.duplicateGroup
  };
}

function goalDTO(goal: InstanceType<typeof Goal>) {
  return {
    id: idOf(goal._id),
    name: goal.name,
    saved: goal.saved,
    target: goal.target,
    currency: goal.currency,
    monthlyContribution: goal.monthlyContribution,
    monthly_contribution: goal.monthlyContribution,
    targetDate: goal.targetDate ? isoDate(goal.targetDate) : null,
    target_date: goal.targetDate ? isoDate(goal.targetDate) : null,
    status: goal.status,
    accent: goal.accent,
    history: goal.history
  };
}

function installmentPurchaseDTO(purchase: InstanceType<typeof InstallmentPurchase>) {
  return {
    id: idOf(purchase._id),
    accountId: idOf(purchase.accountId),
    account_id: idOf(purchase.accountId),
    name: purchase.name,
    category: purchase.category,
    cardName: purchase.cardName,
    card_name: purchase.cardName,
    note: purchase.note || undefined,
    totalAmount: purchase.totalAmount,
    total_amount: purchase.totalAmount,
    installmentAmount: purchase.installmentAmount,
    installment_amount: purchase.installmentAmount,
    totalInstallments: purchase.totalInstallments,
    total_installments: purchase.totalInstallments,
    paidInstallments: purchase.paidInstallments,
    paid_installments: purchase.paidInstallments,
    currency: purchase.currency,
    firstDueDate: isoDate(purchase.firstDueDate),
    first_due_date: isoDate(purchase.firstDueDate),
    reminderDaysBefore: purchase.reminderDaysBefore,
    reminder_days_before: purchase.reminderDaysBefore,
    status: purchase.status,
    installments: purchase.installments.map((installment) => ({
      id: idOf(installment._id),
      number: installment.number,
      amount: installment.amount,
      dueDate: isoDate(installment.dueDate),
      due_date: isoDate(installment.dueDate),
      status: installment.status,
      paidAt: installment.paidAt ? installment.paidAt.toISOString() : null,
      paid_at: installment.paidAt ? installment.paidAt.toISOString() : null,
      transactionId: idOf(installment.transactionId),
      transaction_id: idOf(installment.transactionId)
    }))
  };
}

async function createReminderNotification(input: {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  dueDate: Date;
  reminderDaysBefore: number;
  relatedEntityType: string;
  relatedEntityId: Types.ObjectId;
  metadata?: Record<string, unknown>;
}) {
  const reminderDate = new Date(input.dueDate);
  reminderDate.setDate(reminderDate.getDate() - input.reminderDaysBefore);
  reminderDate.setHours(9, 0, 0, 0);
  const due = new Date(input.dueDate);
  due.setHours(9, 0, 0, 0);
  const dueDay = due.toISOString().slice(0, 10);
  const dedupeKey = `${input.type}:${input.relatedEntityType}:${input.relatedEntityId}:${dueDay}:reminder-${input.reminderDaysBefore}`;
  await Notification.findOneAndUpdate(
    { userId: input.userId, dedupeKey },
    {
      $set: {
        actionType: `open_${input.relatedEntityType}`,
        message: input.message,
        metadata: { ...(input.metadata || {}), dueDate: due.toISOString(), reminderDaysBefore: input.reminderDaysBefore },
        priority: "normal",
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        scheduledFor: reminderDate,
        title: input.title,
        type: input.type
      },
      $setOnInsert: { dedupeKey, status: "pending", userId: input.userId }
    },
    { upsert: true }
  );
}

export async function getExtendedFinance(userId: Types.ObjectId) {
  const [goals, creditCards, recurringPayments, events, installmentPurchases] = await Promise.all([
    Goal.find({ userId }).sort({ createdAt: 1 }),
    CreditCard.find({ userId }).sort({ createdAt: 1 }),
    RecurringPayment.find({ userId, active: { $ne: false } }).sort({ nextChargeDate: 1 }),
    PlannerEvent.find({ userId }).sort({ date: 1 }),
    InstallmentPurchase.find({ userId }).sort({ firstDueDate: 1 })
  ]);

  return {
    goals: goals.map(goalDTO),
    creditCards: creditCards.map((card) => ({
      id: idOf(card._id),
      bank: card.bank,
      name: card.name,
      mask: card.mask,
      currency: card.currency,
      limit: card.limit,
      used: card.used,
      available: Math.max(0, card.limit - card.used),
      closingDate: card.closingDate,
      closing_date: card.closingDate,
      dueDate: card.dueDate,
      due_date: card.dueDate,
      nextPaymentAmount: card.nextPaymentAmount,
      next_payment_amount: card.nextPaymentAmount,
      accent: card.accent
    })),
    recurringPayments: recurringPayments.map(paymentDTO),
    installmentPurchases: installmentPurchases.map(installmentPurchaseDTO),
    installment_purchases: installmentPurchases.map(installmentPurchaseDTO),
    events: events.map((event) => ({
      id: idOf(event._id),
      title: event.title,
      date: isoDate(event.date),
      time: event.time,
      category: event.category,
      done: event.done,
      accent: event.accent
    }))
  };
}

export async function createRecurringPayment(userId: Types.ObjectId, input: Record<string, any>) {
  const payment = await RecurringPayment.create({
    userId,
    merchant: input.merchant,
    category: input.category,
    amount: input.amount,
    currency: input.currency,
    frequency: input.frequency,
    nextChargeDate: input.nextChargeDate,
    reminderDaysBefore: input.reminderDaysBefore ?? 3,
    notificationsEnabled: input.notificationsEnabled !== false,
    accountId: input.accountId || null,
    categoryId: input.categoryId || null,
    active: true,
    status: "pending",
    kind: input.kind || "service",
    confidence: 1,
    priceChange: null,
    duplicateGroup: null
  });

  if (input.notificationsEnabled !== false) await createReminderNotification({
    dueDate: payment.nextChargeDate,
    message: payment.kind === "income"
      ? `Esperás recibir ${payment.merchant} por ${payment.amount.toLocaleString("es-UY")} el ${payment.nextChargeDate.toLocaleDateString("es-UY")}.`
      : `${payment.merchant} por ${payment.amount.toLocaleString("es-UY")} vence el ${payment.nextChargeDate.toLocaleDateString("es-UY")}.`,
    relatedEntityId: payment._id,
    relatedEntityType: "payment",
    metadata: { amount: payment.amount, currency: payment.currency, kind: payment.kind, name: payment.merchant },
    reminderDaysBefore: payment.reminderDaysBefore,
    title: payment.kind === "income" ? `${payment.merchant} se espera pronto` : `${payment.merchant} vence en ${payment.reminderDaysBefore} días`,
    type: payment.kind === "income" ? "income_reminder" : "payment_reminder",
    userId
  });

  return paymentDTO(payment);
}

export async function createGoal(userId: Types.ObjectId, input: Record<string, any>) {
  const goal = await Goal.create({
    userId,
    name: input.name,
    target: input.target,
    saved: input.saved || 0,
    currency: input.currency,
    monthlyContribution: input.monthlyContribution || 0,
    targetDate: input.targetDate || null,
    status: Number(input.saved || 0) >= Number(input.target) ? "completed" : "active",
    accent: "lime",
    history: []
  });
  return goalDTO(goal);
}

export async function addMoneyToGoal(userId: Types.ObjectId, id: string, amount: number) {
  const goal = await Goal.findOne({ _id: id, userId });
  if (!goal) throw new AppError("Meta no encontrada.", 404, "GOAL_NOT_FOUND");
  goal.saved += amount;
  goal.status = goal.saved >= goal.target ? "completed" : "active";
  goal.history.push({ month: new Date().toISOString().slice(0, 7), saved: goal.saved, target: goal.target });
  await goal.save();
  return goalDTO(goal);
}

export async function createInstallmentPurchase(userId: Types.ObjectId, input: Record<string, any>) {
  const totalInstallments = Number(input.totalInstallments);
  const totalInCents = Math.round(Number(input.totalAmount) * 100);
  const regularInstallmentInCents = Math.floor(totalInCents / totalInstallments);
  const installmentAmount = regularInstallmentInCents / 100;
  const firstDueDate = new Date(input.firstDueDate);
  const installments = Array.from({ length: totalInstallments }, (_, index) => ({
    number: index + 1,
    amount: index === totalInstallments - 1
      ? (totalInCents - regularInstallmentInCents * (totalInstallments - 1)) / 100
      : installmentAmount,
    dueDate: addMonths(firstDueDate, index),
    status: "pending"
  }));
  const purchase = await InstallmentPurchase.create({
    userId,
    accountId: input.accountId || null,
    name: input.name,
    category: input.category,
    cardName: input.cardName,
    note: input.note || null,
    totalAmount: input.totalAmount,
    installmentAmount,
    totalInstallments,
    paidInstallments: 0,
    currency: input.currency,
    firstDueDate,
    reminderDaysBefore: input.reminderDaysBefore ?? 3,
    status: "active",
    installments
  });

  for (const installment of purchase.installments) {
    await createReminderNotification({
      dueDate: installment.dueDate,
      message: `Cuota ${installment.number} de ${purchase.totalInstallments} de ${purchase.name} por ${installment.amount.toLocaleString("es-UY")}.`,
      relatedEntityId: purchase._id,
      relatedEntityType: "installment",
      metadata: { amount: installment.amount, currency: purchase.currency, dueDate: installment.dueDate, installmentId: idOf(installment._id), installmentNumber: installment.number, name: purchase.name, totalInstallments: purchase.totalInstallments },
      reminderDaysBefore: purchase.reminderDaysBefore,
      title: `Cuota ${installment.number} de ${purchase.totalInstallments} vence en ${purchase.reminderDaysBefore} días`,
      type: "installment_due",
      userId
    });
  }

  return installmentPurchaseDTO(purchase);
}

async function accountAndCategory(userId: Types.ObjectId, accountId: Types.ObjectId | null, categoryName: string, categoryId?: Types.ObjectId | null, type: "income" | "expense" = "expense") {
  const account = accountId ? await Account.findOne({ _id: accountId, userId, isActive: true }) : await Account.findOne({ userId, isActive: true });
  if (!account) throw new AppError(type === "income" ? "Necesitás una cuenta de destino para registrar el ingreso." : "Necesitás una cuenta para registrar el gasto.", 400, "ACCOUNT_REQUIRED");
  const category = categoryId ? await Category.findOne({ _id: categoryId, type, isActive: true, $or: [{ userId }, { isSystem: true, userId: null }] }) : await Category.findOne({ type, isActive: true, $or: [{ userId }, { isSystem: true, userId: null }], name: { $regex: categoryName, $options: "i" } })
    || await Category.findOne({ type, isActive: true, $or: [{ userId }, { isSystem: true, userId: null }] });
  if (!category) throw new AppError(type === "income" ? "No hay categoría de ingreso disponible." : "No hay categoría de gasto disponible.", 400, "CATEGORY_REQUIRED");
  return { account, category };
}

export async function markRecurringPaymentPaid(userId: Types.ObjectId, id: string) {
  const payment = await RecurringPayment.findOne({ _id: id, userId });
  if (!payment) throw new AppError("Pago programado no encontrado.", 404, "PAYMENT_NOT_FOUND");
  if (payment.lastTransactionId && payment.lastPaidAt && Date.now() - payment.lastPaidAt.getTime() < 60_000) {
    return { payment: paymentDTO(payment), transactionId: idOf(payment.lastTransactionId) };
  }
  const transactionType = payment.kind === "income" ? "income" : "expense";
  const { account, category } = await accountAndCategory(userId, payment.accountId as Types.ObjectId | null, payment.category, payment.categoryId as Types.ObjectId | null, transactionType);
  if (transactionType === "expense") await validateExpenseAgainstAvailableBalance({ userId, amount: payment.amount, date: payment.nextChargeDate });
  const existingTransaction = await Transaction.findOne({
    userId,
    accountId: account._id,
    type: transactionType,
    merchant: payment.merchant,
    amount: payment.amount,
    currency: payment.currency,
    date: payment.nextChargeDate,
    note: transactionType === "income" ? "Ingreso previsto confirmado como recibido." : "Pago programado marcado como pagado."
  });
  if (existingTransaction) {
    return { payment: paymentDTO(payment), transactionId: idOf(existingTransaction._id) };
  }
  const transaction = await Transaction.create({
    userId,
    accountId: account._id,
    categoryId: category._id,
    type: transactionType,
    title: payment.merchant,
    merchant: payment.merchant,
    amount: payment.amount,
    currency: payment.currency,
    date: payment.nextChargeDate,
    note: transactionType === "income" ? "Ingreso previsto confirmado como recibido." : "Pago programado marcado como pagado.",
    paymentMethod: account.type,
    isRecurring: payment.frequency !== "once",
    isAntExpense: false,
    scheduledPaymentId: payment._id
  });
  account.currentBalance += transactionType === "income" ? payment.amount : -payment.amount;
  await account.save();
  payment.lastPaidAt = new Date();
  payment.lastTransactionId = transaction._id;
  payment.status = payment.frequency === "once" ? "paid" : "pending";
  payment.active = payment.frequency !== "once";
  if (payment.frequency === "monthly") payment.nextChargeDate = addMonths(payment.nextChargeDate, 1);
  if (payment.frequency === "annual") payment.nextChargeDate = addYears(payment.nextChargeDate, 1);
  if (payment.frequency === "weekly") {
    const next = new Date(payment.nextChargeDate);
    next.setDate(next.getDate() + 7);
    payment.nextChargeDate = next;
  }
  if (payment.frequency === "fortnightly") {
    const next = new Date(payment.nextChargeDate);
    next.setDate(next.getDate() + 14);
    payment.nextChargeDate = next;
  }
  await payment.save();
  await Notification.updateMany({ userId, relatedEntityType: "payment", relatedEntityId: payment._id, status: { $in: ["pending", "read", "snoozed"] } }, { status: "completed", readAt: new Date() });
  if (payment.active) {
    await createReminderNotification({
      dueDate: payment.nextChargeDate,
      message: payment.kind === "income" ? `Esperás recibir ${payment.merchant} por ${payment.amount.toLocaleString("es-UY")} el ${payment.nextChargeDate.toLocaleDateString("es-UY")}.` : `${payment.merchant} por ${payment.amount.toLocaleString("es-UY")} vence el ${payment.nextChargeDate.toLocaleDateString("es-UY")}.`,
      relatedEntityId: payment._id,
      relatedEntityType: "payment",
      metadata: { amount: payment.amount, currency: payment.currency, kind: payment.kind, name: payment.merchant },
      reminderDaysBefore: payment.reminderDaysBefore,
      title: payment.kind === "income" ? `${payment.merchant} se espera pronto` : `${payment.merchant} vence en ${payment.reminderDaysBefore} días`,
      type: payment.kind === "income" ? "income_reminder" : "payment_reminder",
      userId
    });
  }
  return { payment: paymentDTO(payment), transactionId: idOf(transaction._id) };
}

export async function markInstallmentPaid(userId: Types.ObjectId, purchaseId: string, installmentId: string) {
  const purchase = await InstallmentPurchase.findOne({ _id: purchaseId, userId });
  if (!purchase) throw new AppError("Compra en cuotas no encontrada.", 404, "INSTALLMENT_PURCHASE_NOT_FOUND");
  const installment = purchase.installments.id(installmentId);
  if (!installment) throw new AppError("Cuota no encontrada.", 404, "INSTALLMENT_NOT_FOUND");
  if (installment.transactionId) return installmentPurchaseDTO(purchase);
  if (installment.status === "paid") return installmentPurchaseDTO(purchase);
  const { account, category } = await accountAndCategory(userId, purchase.accountId as Types.ObjectId | null, purchase.category);
  await validateExpenseAgainstAvailableBalance({ userId, amount: installment.amount, date: installment.dueDate });
  const transaction = await Transaction.create({
    userId,
    accountId: account._id,
    categoryId: category._id,
    type: "expense",
    title: `${purchase.name} · Cuota ${installment.number} de ${purchase.totalInstallments}`,
    merchant: purchase.name,
    amount: installment.amount,
    currency: purchase.currency,
    date: installment.dueDate,
    note: "Cuota marcada como pagada.",
    paymentMethod: account.type,
    isRecurring: false,
    isAntExpense: false
  });
  account.currentBalance -= installment.amount;
  await account.save();
  installment.status = "paid";
  installment.paidAt = new Date();
  installment.transactionId = transaction._id;
  purchase.paidInstallments = purchase.installments.filter((item) => item.status === "paid").length;
  purchase.status = purchase.paidInstallments >= purchase.totalInstallments ? "completed" : "active";
  await purchase.save();
  await Notification.updateMany({ userId, relatedEntityType: "installment", relatedEntityId: purchase._id, "metadata.installmentId": idOf(installment._id), status: { $in: ["pending", "read", "snoozed"] } }, { status: "completed", readAt: new Date() });
  return installmentPurchaseDTO(purchase);
}
