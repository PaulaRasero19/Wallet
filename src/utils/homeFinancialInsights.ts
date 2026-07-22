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
    meta: string;
    title: string;
    trend: InsightTrend;
    trendState: InsightTrendState;
  };
  incomeUsed: {
    percentage: number | null;
    differenceFromPreviousMonth: number | null;
    meta: string;
    overspentAmount: number;
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

function isRefund(transaction: Transaction) {
  if (transaction.type === "refund") return true;
  if (transaction.type !== "income") return false;
  const text = textFor(transaction);
  return ["reintegro", "devolucion", "devolución", "refund"].some((keyword) => text.includes(keyword));
}

function isCompletedForTotals(transaction: Transaction) {
  const status = transaction.status || transaction.transactionStatus || transaction.transaction_status;
  if (transaction.type === "income" || transaction.type === "refund") return status === "completed" || status === "received";
  if (transaction.type === "expense") return status === "completed" || status === "paid";
  return false;
}

function sumByType(transactions: Transaction[], type: Transaction["type"]) {
  return transactions.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
}

function sumRefunds(transactions: Transaction[]) {
  return transactions.filter(isRefund).reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
}

function sumAdditionalIncome(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === "income" && !isRefund(transaction)).reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
}

function sumExpenses(transactions: Transaction[]) {
  return sumByType(transactions, "expense");
}

export function clampPercentage(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, value));
}

function compareNumber(current: number, previous: number): InsightTrend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

function trendStateFor(trend: InsightTrend, upIsPositive: boolean): InsightTrendState {
  if (trend === "neutral") return { direction: "down", tone: "neutral" };
  const tone = trend === "up" ? (upIsPositive ? "positive" : "negative") : upIsPositive ? "negative" : "positive";
  return { direction: tone === "positive" ? "up" : "down", tone };
}

function safePercentage(part: number, total: number) {
  if (total <= 0) return null;
  return (part / total) * 100;
}

export function calculateMonthlyFinancialSummary({
  baseMonthlyIncome,
  currentMonthTransactions,
  previousMonthTransactions,
  savingsGoal
}: {
  baseMonthlyIncome: number;
  currentMonthTransactions: Transaction[];
  previousMonthTransactions: Transaction[];
  savingsGoal?: Goal;
}) {
  const currentGrossExpenses = sumExpenses(currentMonthTransactions);
  const previousGrossExpenses = sumExpenses(previousMonthTransactions);
  const currentRefunds = sumRefunds(currentMonthTransactions);
  const previousRefunds = sumRefunds(previousMonthTransactions);
  const currentAdditionalIncome = sumAdditionalIncome(currentMonthTransactions);
  const previousAdditionalIncome = sumAdditionalIncome(previousMonthTransactions);
  // A configured salary is a fallback for months without an income movement,
  // never an additional amount on top of the received salary transaction.
  const currentIncome = currentAdditionalIncome > 0 ? currentAdditionalIncome : Math.max(0, baseMonthlyIncome);
  const previousIncome = previousAdditionalIncome > 0 ? previousAdditionalIncome : Math.max(0, baseMonthlyIncome);
  const currentNetExpenses = Math.max(0, currentGrossExpenses - currentRefunds);
  const previousNetExpenses = Math.max(0, previousGrossExpenses - previousRefunds);
  const currentSavings = currentIncome - currentNetExpenses;
  const previousSavings = previousIncome - previousNetExpenses;
  const safeCurrentSavings = Math.max(0, currentSavings);
  const safePreviousSavings = Math.max(0, previousSavings);
  const monthlyGoalAmount = Number(savingsGoal?.monthlyContribution || 0);
  const rawIncomeUsedPercentage = safePercentage(currentNetExpenses, currentIncome);
  const previousIncomeUsedPercentage = safePercentage(previousNetExpenses, previousIncome);
  const incomeUsedPercentage = clampPercentage(rawIncomeUsedPercentage);
  const savingsRate = clampPercentage(safePercentage(safeCurrentSavings, currentIncome));
  const previousSavingsRate = clampPercentage(safePercentage(safePreviousSavings, previousIncome));
  const goalProgress = monthlyGoalAmount > 0 ? clampPercentage(safePercentage(safeCurrentSavings, monthlyGoalAmount)) : null;
  const previousGoalProgress = monthlyGoalAmount > 0 ? clampPercentage(safePercentage(safePreviousSavings, monthlyGoalAmount)) : null;
  const overspentAmount = Math.max(0, currentNetExpenses - currentIncome);

  return {
    additionalIncome: currentAdditionalIncome,
    baseMonthlyIncome,
    currentSavings,
    goalProgress,
    grossExpenses: currentGrossExpenses,
    incomeUsedPercentage,
    netExpenses: currentNetExpenses,
    overspentAmount,
    previousGoalProgress,
    previousIncomeUsedPercentage: clampPercentage(previousIncomeUsedPercentage),
    previousSavings,
    previousSavingsRate,
    refunds: currentRefunds,
    safeCurrentSavings,
    savingsRate,
    totalAvailableIncome: currentIncome
  };
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
  const completedTransactions = transactions.filter(isCompletedForTotals);
  const currentMonthTransactions = completedTransactions.filter((transaction) => isWithin(transaction.date, currentStart, nextStart));
  const previousMonthTransactions = completedTransactions.filter((transaction) => isWithin(transaction.date, previousStart, currentStart));
  const summary = calculateMonthlyFinancialSummary({
    baseMonthlyIncome: monthlyIncome,
    currentMonthTransactions,
    previousMonthTransactions,
    savingsGoal
  });
  const currentSmallExpenses = currentMonthTransactions.filter((transaction) => isSmallExpense(transaction, monthlyIncome));
  const previousSmallExpenses = previousMonthTransactions.filter((transaction) => isSmallExpense(transaction, monthlyIncome));
  const smallExpenseRefunds = currentMonthTransactions.filter((transaction) => isRefund(transaction) && isNonEssentialExpense(transaction)).reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const previousSmallExpenseRefunds = previousMonthTransactions.filter((transaction) => isRefund(transaction) && isNonEssentialExpense(transaction)).reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const smallExpenseTotal = Math.max(0, currentSmallExpenses.reduce((sum, transaction) => sum + positiveAmount(transaction), 0) - smallExpenseRefunds);
  const previousSmallExpenseTotal = Math.max(0, previousSmallExpenses.reduce((sum, transaction) => sum + positiveAmount(transaction), 0) - previousSmallExpenseRefunds);
  const smallExpenseTrend = compareNumber(smallExpenseTotal, previousSmallExpenseTotal);
  const monthlyGoalAmount = Number(savingsGoal?.monthlyContribution || 0);
  const savingsComparisonCurrent = monthlyGoalAmount > 0 ? summary.goalProgress : summary.savingsRate;
  const savingsComparisonPrevious = monthlyGoalAmount > 0 ? summary.previousGoalProgress : summary.previousSavingsRate;
  const savingsTrend = summary.overspentAmount > 0
    ? "down"
    : savingsComparisonPrevious === null || savingsComparisonCurrent === null
      ? "neutral"
      : compareNumber(savingsComparisonCurrent, savingsComparisonPrevious);
  const incomeUsedTrend = summary.previousIncomeUsedPercentage === null || summary.incomeUsedPercentage === null
    ? "neutral"
    : compareNumber(summary.incomeUsedPercentage, summary.previousIncomeUsedPercentage);
  const hasIncomeConfigured = monthlyIncome > 0;

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
      amount: summary.currentSavings,
      goalProgress: summary.goalProgress,
      meta: summary.overspentAmount > 0
        ? `Excediste tus ingresos por ${summary.overspentAmount}`
        : summary.goalProgress === 100
          ? "Meta alcanzada"
          : "",
      rate: summary.savingsRate,
      title: monthlyGoalAmount > 0 ? "Objetivo de ahorro\nmensual" : "Ahorro del mes",
      trend: savingsTrend,
      trendState: summary.overspentAmount > 0 || summary.currentSavings < 0
        ? { direction: "down", tone: "negative" }
        : summary.goalProgress === 100
          ? { direction: "up", tone: "positive" }
          : trendStateFor(savingsTrend, true)
    },
    incomeUsed: {
      differenceFromPreviousMonth: summary.incomeUsedPercentage !== null && summary.previousIncomeUsedPercentage !== null ? summary.incomeUsedPercentage - summary.previousIncomeUsedPercentage : null,
      meta: !hasIncomeConfigured
        ? "Configurá tus ingresos para calcularlo"
        : summary.overspentAmount > 0
          ? `Excediste tus ingresos por ${summary.overspentAmount}`
          : "",
      overspentAmount: summary.overspentAmount,
      percentage: hasIncomeConfigured ? summary.incomeUsedPercentage : null,
      trend: incomeUsedTrend,
      trendState: summary.overspentAmount > 0 ? { direction: "down", tone: "negative" } : trendStateFor(incomeUsedTrend, false)
    }
  };
}
