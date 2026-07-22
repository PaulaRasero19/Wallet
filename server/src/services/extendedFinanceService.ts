import { Types } from "mongoose";
import { CreditCard } from "../models/CreditCard";
import { Goal } from "../models/Goal";
import { PlannerEvent } from "../models/PlannerEvent";
import { RecurringPayment } from "../models/RecurringPayment";

function idOf(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? value.toString() : String(value || "");
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

type RecurringPaymentInput = {
  merchant: string;
  category: string;
  amount: number;
  currency: "UYU" | "USD" | "EUR";
  frequency: "weekly" | "monthly" | "annual";
  nextChargeDate: Date;
  kind?: "fixed" | "subscription" | "service";
};

export async function getExtendedFinance(userId: Types.ObjectId) {
  const [goals, creditCards, recurringPayments, events] = await Promise.all([
    Goal.find({ userId }).sort({ createdAt: 1 }),
    CreditCard.find({ userId }).sort({ createdAt: 1 }),
    RecurringPayment.find({ userId }).sort({ nextChargeDate: 1 }),
    PlannerEvent.find({ userId }).sort({ date: 1 })
  ]);

  return {
    goals: goals.map((goal) => ({
      id: idOf(goal._id),
      name: goal.name,
      saved: goal.saved,
      target: goal.target,
      currency: goal.currency,
      monthlyContribution: goal.monthlyContribution,
      monthly_contribution: goal.monthlyContribution,
      accent: goal.accent,
      history: goal.history
    })),
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
    recurringPayments: recurringPayments.map((payment) => ({
      id: idOf(payment._id),
      merchant: payment.merchant,
      category: payment.category,
      amount: payment.amount,
      currency: payment.currency,
      frequency: payment.frequency,
      nextChargeDate: isoDate(payment.nextChargeDate),
      next_charge_date: isoDate(payment.nextChargeDate),
      status: payment.status,
      kind: payment.kind,
      confidence: payment.confidence,
      priceChange: payment.priceChange,
      price_change: payment.priceChange,
      duplicateGroup: payment.duplicateGroup,
      duplicate_group: payment.duplicateGroup
    })),
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

export async function createRecurringPayment(userId: Types.ObjectId, input: RecurringPaymentInput) {
  const payment = await RecurringPayment.create({
    userId,
    merchant: input.merchant,
    category: input.category,
    amount: input.amount,
    currency: input.currency,
    frequency: input.frequency,
    nextChargeDate: input.nextChargeDate,
    status: "pending",
    kind: input.kind || "service",
    confidence: 1,
    priceChange: null,
    duplicateGroup: null
  });

  return {
    id: idOf(payment._id),
    merchant: payment.merchant,
    category: payment.category,
    amount: payment.amount,
    currency: payment.currency,
    frequency: payment.frequency,
    nextChargeDate: isoDate(payment.nextChargeDate),
    next_charge_date: isoDate(payment.nextChargeDate),
    status: payment.status,
    kind: payment.kind,
    confidence: payment.confidence,
    priceChange: payment.priceChange,
    price_change: payment.priceChange,
    duplicateGroup: payment.duplicateGroup,
    duplicate_group: payment.duplicateGroup
  };
}
