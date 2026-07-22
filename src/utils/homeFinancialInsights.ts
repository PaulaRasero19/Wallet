import { Currency, Goal, Transaction } from "../types/finflow";
import { positiveAmount } from "./financeInsights";

export type InsightTrend = "up" | "down" | "neutral";
export type InsightTone = "positive" | "negative" | "neutral";

type InsightTrendState = {
  direction: "up" | "down";
  tone: InsightTone;
};

export type HomeFinancialInsights = {
  hasMovements: boolean;
  smallExpenses: {
    count: number;
    total: number;
    potentialSavings: number;
    trend: InsightTrend;
    trendState: InsightTrendState;
  };
  savings: {
    amount: number;
    rate: number | null;
    goalProgress: number | null;
    title: string;
    trend: InsightTrend;
    trendState: InsightTrendState;
  };
  incomeUsed: {
    percentage: number | null;
    differenceFromPreviousMonth: number | null;
    trend: InsightTrend;
    trendState: InsightTrendState;
  };
};

const nonEssentialKeywords = [
  "cafe",
  "café",
  "snack",
  "delivery",
  "pedido",
  "pedidosya",
  "rappi",
  "conveniencia",
  "kiosco",
  "salida",
  "amigos",
  "bar",
  "helado",
  "dulce",
  "impulsiva",
  "suscripcion",
  "suscripción"
];

const essentialKeywords = [
  "alquiler",
  "ute",
  "ose",
  "antel",
  "servicio",
  "salud",
  "medico",
  "médico",
  "educacion",
  "educación",
  "transporte",
  "cuota",
  "prestamo",
  "préstamo",
  "gasto fijo",
  "seguro",
  "farmacia"
];

function monthBounds(base = new Date()) {
  const currentStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const nextStart = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const previousStart = new Date(base.getFullYear(), base.getMonth() - 1, 1);

  return { currentStart, nextStart, previousStart };
}

function isWithin(date: string, start: Date, end: Date) {
  const value = new Date(date).getTime();
  return value >= start.getTime() && value < end.getTime();
}

function textFor(transaction: Transaction) {
  return [
    transaction.title,
    transaction.merchant,
    transaction.note,
    transaction.category,
    transaction.payment_method,
    transaction.paymentMethod
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isEssentialExpense(transaction: Transaction) {
  const text = textFor(transaction);
  return essentialKeywords.some((keyword) => text.includes(keyword));
}

function isNonEssentialExpense(transaction: Transaction) {
  const text = textFor(transaction);
  return nonEssentialKeywords.some((keyword) => text.includes(keyword));
}

function isSmallExpense(transaction: Transaction, monthlyIncome: number) {
  if (transaction.type !== "expense") return false;
  if (transaction.is_ant_expense || transaction.isAntExpense) return true;
  if (isEssentialExpense(transaction)) return false;

  const amount = positiveAmount(transaction);
  const incomeThreshold = monthlyIncome > 0 ? monthlyIncome * 0.01 : 0;
  const threshold = incomeThreshold > 0 ? incomeThreshold : 500;

  return amount <= threshold && isNonEssentialExpense(transaction);
}

function sumExpenses(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
}

function compareNumber(current: number, previous: number): InsightTrend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

function trendStateFor(trend: InsightTrend, upIsPositive: boolean): InsightTrendState {
  if (trend === "neutral") return { direction: "down", tone: "neutral" };
  const tone = trend === "up" ? (upIsPositive ? "positive" : "negative") : upIsPositive ? "negative" : "positive";
  return { direction: trend, tone };
}

function safePercentage(part: number, total: number) {
  if (total <= 0) return null;
  return (part / total) * 100;
}

export function calculateFinancialInsights({
  monthlyIncome,
  savingsGoal,
  transactions
}: {
  currencyCode: Currency;
  monthlyIncome: number;
  savingsGoal?: Goal;
  transactions: Transaction[];
}): HomeFinancialInsights {
  const { currentStart, nextStart, previousStart } = monthBounds();
  const currentMonthTransactions = transactions.filter((transaction) => isWithin(transaction.date, currentStart, nextStart));
  const previousMonthTransactions = transactions.filter((transaction) => isWithin(transaction.date, previousStart, currentStart));
  const currentMonthExpenses = sumExpenses(currentMonthTransactions);
  const previousMonthExpenses = sumExpenses(previousMonthTransactions);
  const currentSmallExpenses = currentMonthTransactions.filter((transaction) => isSmallExpense(transaction, monthlyIncome));
  const previousSmallExpenses = previousMonthTransactions.filter((transaction) => isSmallExpense(transaction, monthlyIncome));
  const smallExpenseTotal = currentSmallExpenses.reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const previousSmallExpenseTotal = previousSmallExpenses.reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const smallExpenseTrend = compareNumber(smallExpenseTotal, previousSmallExpenseTotal);
  const currentMonthSavings = monthlyIncome > 0 ? monthlyIncome - currentMonthExpenses : 0;
  const previousMonthSavings = monthlyIncome > 0 ? monthlyIncome - previousMonthExpenses : 0;
  const savingsRate = safePercentage(currentMonthSavings, monthlyIncome);
  const previousSavingsRate = safePercentage(previousMonthSavings, monthlyIncome);
  const monthlyGoalAmount = Number(savingsGoal?.monthlyContribution || 0);
  const goalProgress = monthlyGoalAmount > 0 ? safePercentage(currentMonthSavings, monthlyGoalAmount) : null;
  const savingsTrend = previousSavingsRate === null || savingsRate === null ? "neutral" : compareNumber(savingsRate, previousSavingsRate);
  const incomeUsedPercentage = safePercentage(currentMonthExpenses, monthlyIncome);
  const previousIncomeUsedPercentage = safePercentage(previousMonthExpenses, monthlyIncome);
  const incomeUsedTrend = previousIncomeUsedPercentage === null || incomeUsedPercentage === null ? "neutral" : compareNumber(incomeUsedPercentage, previousIncomeUsedPercentage);

  return {
    hasMovements: currentMonthTransactions.length > 0,
    smallExpenses: {
      count: currentSmallExpenses.length,
      potentialSavings: smallExpenseTotal * 0.5,
      total: smallExpenseTotal,
      trend: smallExpenseTrend,
      trendState: trendStateFor(smallExpenseTrend, false)
    },
    savings: {
      amount: currentMonthSavings,
      goalProgress,
      rate: savingsRate,
      title: monthlyGoalAmount > 0 ? "Objetivo de ahorro\nmensual" : "Ahorro del mes",
      trend: savingsTrend,
      trendState: trendStateFor(savingsTrend, true)
    },
    incomeUsed: {
      differenceFromPreviousMonth: incomeUsedPercentage !== null && previousIncomeUsedPercentage !== null ? incomeUsedPercentage - previousIncomeUsedPercentage : null,
      percentage: incomeUsedPercentage,
      trend: incomeUsedTrend,
      trendState: trendStateFor(incomeUsedTrend, false)
    }
  };
}
