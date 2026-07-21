import {
  Account,
  Budget,
  CreditCard,
  ExchangeRates,
  Goal,
  RecurringPayment,
  Transaction
} from "../types/finflow";
import { percentage, toBaseCurrency } from "../utils/money";

export type AntExpenseAnalysis = {
  total: number;
  count: number;
  average: number;
  mainMerchant: string;
  mainCategory: string;
  frequentDay: string;
  frequentTime: string;
  monthlyExpensePercent: number;
  annualProjection: number;
  savings25: number;
  savings50: number;
  savings75: number;
  goalRelation: string;
};

export type RecurringDetection = {
  id: string;
  merchant: string;
  amount: number;
  status: string;
  nextChargeDate: string;
  annualTotal: number;
  note: string;
};

export type ForecastScenario = {
  id: "current" | "moderate" | "intensive";
  title: string;
  projectedBalance: number;
  recommendedDailySpend: number;
  risk: "Low" | "Medium" | "High";
  categoriesToReduce: string[];
  actions: string[];
};

export type ForecastResult = {
  currentBalance: number;
  expectedIncome: number;
  accumulatedExpenses: number;
  pendingFixedPayments: number;
  pendingSubscriptions: number;
  pendingInstallments: number;
  remainingBudgets: number;
  antExpenses: AntExpenseAnalysis;
  committedSavings: number;
  activeGoals: number;
  daysUntilIncome: number;
  realAvailable: number;
  projectedEndBalance: number;
  dailyLimit: number;
  financialRisk: "Low" | "Medium" | "High";
  scenarios: ForecastScenario[];
  recurringDetections: RecurringDetection[];
};

type ForecastInput = {
  accounts: Account[];
  budgets: Budget[];
  creditCards: CreditCard[];
  exchangeRates: ExchangeRates;
  expectedIncome?: number;
  goals: Goal[];
  recurringPayments: RecurringPayment[];
  transactions: Transaction[];
  nextIncomeDate?: string | null;
};

function daysBetween(date: Date, target: Date) {
  const diff = target.getTime() - date.getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
}

function tally(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function topKey(items: string[], fallback: string) {
  const entries = Object.entries(tally(items)).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || fallback;
}

function timeSlot(hour?: number) {
  if (hour == null) return "afternoon";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function toUYU(value: number, currency: string, exchangeRates: ExchangeRates) {
  return toBaseCurrency(value, currency as keyof ExchangeRates, exchangeRates);
}

function analyzeAntExpenses(transactions: Transaction[], goals: Goal[], totalExpenses: number, exchangeRates: ExchangeRates): AntExpenseAnalysis {
  const antTransactions = transactions.filter((transaction) => {
    const amount = Math.abs(toUYU(transaction.amount, transaction.currency, exchangeRates));
    return transaction.type === "expense" && (transaction.isAntExpense || amount <= 700);
  });
  const total = antTransactions.reduce((sum, transaction) => sum + Math.abs(toUYU(transaction.amount, transaction.currency, exchangeRates)), 0);
  const count = antTransactions.length;
  const savings50 = total * 0.5;
  const targetGoal = goals[0];
  const monthsSaved = targetGoal?.monthlyContribution ? Math.max(1, Math.round(savings50 / targetGoal.monthlyContribution)) : 1;

  return {
    total,
    count,
    average: count ? total / count : 0,
    mainMerchant: topKey(antTransactions.map((transaction) => transaction.merchant), "No pattern"),
    mainCategory: topKey(antTransactions.map((transaction) => transaction.category), "No category"),
    frequentDay: topKey(antTransactions.map((transaction) => transaction.weekday || "Unknown"), "Unknown"),
    frequentTime: topKey(antTransactions.map((transaction) => timeSlot(transaction.hour)), "afternoon"),
    monthlyExpensePercent: percentage(total, totalExpenses),
    annualProjection: total * 12,
    savings25: total * 0.25,
    savings50,
    savings75: total * 0.75,
    goalRelation: targetGoal
      ? `Reducing half could move ${targetGoal.name} forward by about ${monthsSaved} month${monthsSaved > 1 ? "s" : ""}.`
      : "Create a goal to connect small expenses with savings progress."
  };
}

function recurringSummary(payments: RecurringPayment[]): RecurringDetection[] {
  return payments
    .filter((payment) => payment.status !== "rejected")
    .map((payment) => ({
      id: payment.id,
      merchant: payment.merchant,
      amount: payment.amount,
      status: payment.status,
      nextChargeDate: payment.nextChargeDate,
      annualTotal: payment.frequency === "annual" ? payment.amount : payment.frequency === "weekly" ? payment.amount * 52 : payment.amount * 12,
      note:
        payment.duplicateGroup != null
          ? "Possible duplicated subscription."
          : payment.priceChange
            ? `Price changed by $U${payment.priceChange}.`
            : `${Math.round(payment.confidence * 100)}% recurring confidence.`
    }));
}

function buildScenario(
  id: ForecastScenario["id"],
  title: string,
  baseBalance: number,
  days: number,
  dailyBurn: number,
  reduction: number,
  antExpenses: AntExpenseAnalysis,
  budgets: Budget[]
): ForecastScenario {
  const projectedVariableSpend = dailyBurn * days * (1 - reduction);
  const projectedBalance = baseBalance - projectedVariableSpend + antExpenses.total * reduction;
  const recommendedDailySpend = Math.max(0, projectedBalance / days);
  const risk = projectedBalance < 0 ? "High" : recommendedDailySpend < 450 ? "Medium" : "Low";
  const categoriesToReduce = [...budgets]
    .sort((a, b) => percentage(b.spent, b.limit) - percentage(a.spent, a.limit))
    .slice(0, id === "intensive" ? 3 : 2)
    .map((budget) => budget.name);

  return {
    id,
    title,
    projectedBalance,
    recommendedDailySpend,
    risk,
    categoriesToReduce,
    actions:
      id === "current"
        ? ["Keep tracking every expense for the next 7 days.", "Confirm pending recurring payments."]
        : id === "moderate"
          ? ["Reduce small repeated purchases by 30%.", "Set a weekly cap for food delivery."]
          : ["Pause non-essential shopping.", "Move subscription duplicates to review.", "Use the daily limit before each purchase."]
  };
}

export function buildForecast(input: ForecastInput): ForecastResult {
  const today = new Date();
  const currentBalance = input.accounts.reduce((sum, account) => sum + toUYU(account.balance, account.currency, input.exchangeRates), 0);
  const accumulatedExpenses = input.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Math.abs(toUYU(transaction.amount, transaction.currency, input.exchangeRates)), 0);
  const expectedIncome = input.expectedIncome || 0;
  const pendingPayments = input.recurringPayments.filter((payment) => payment.status !== "rejected" && new Date(payment.nextChargeDate) >= today);
  const pendingFixedPayments = pendingPayments
    .filter((payment) => payment.kind !== "subscription")
    .reduce((sum, payment) => sum + toUYU(payment.amount, payment.currency, input.exchangeRates), 0);
  const pendingSubscriptions = pendingPayments
    .filter((payment) => payment.kind === "subscription")
    .reduce((sum, payment) => sum + toUYU(payment.amount, payment.currency, input.exchangeRates), 0);
  const pendingInstallments = input.transactions.reduce((sum, transaction) => {
    if (!transaction.installment) return sum;
    return sum + toUYU(transaction.installment.amountPerInstallment, transaction.currency, input.exchangeRates);
  }, 0);
  const committedSavings = input.goals.reduce((sum, goal) => sum + toUYU(goal.monthlyContribution, goal.currency, input.exchangeRates), 0);
  const remainingBudgets = input.budgets.reduce((sum, budget) => sum + Math.max(0, toUYU(budget.limit - budget.spent, budget.currency, input.exchangeRates)), 0);
  const daysUntilIncome = input.nextIncomeDate ? daysBetween(today, new Date(input.nextIncomeDate)) : 1;
  const antExpenses = analyzeAntExpenses(input.transactions, input.goals, accumulatedExpenses, input.exchangeRates);
  const realAvailable = currentBalance - pendingFixedPayments - pendingSubscriptions - pendingInstallments - committedSavings;
  const elapsedDays = Math.max(1, today.getDate());
  const dailyBurn = accumulatedExpenses / elapsedDays;
  const projectedEndBalance = realAvailable + expectedIncome - dailyBurn * daysUntilIncome;
  const dailyLimit = Math.max(0, realAvailable / daysUntilIncome);
  const financialRisk = realAvailable < 0 || projectedEndBalance < 0 ? "High" : dailyLimit < 450 ? "Medium" : "Low";

  return {
    currentBalance,
    expectedIncome,
    accumulatedExpenses,
    pendingFixedPayments,
    pendingSubscriptions,
    pendingInstallments,
    remainingBudgets,
    antExpenses,
    committedSavings,
    activeGoals: input.goals.length,
    daysUntilIncome,
    realAvailable,
    projectedEndBalance,
    dailyLimit,
    financialRisk,
    scenarios: [
      buildScenario("current", "Actual", projectedEndBalance, daysUntilIncome, dailyBurn, 0, antExpenses, input.budgets),
      buildScenario("moderate", "Ahorro moderado", projectedEndBalance, daysUntilIncome, dailyBurn, 0.3, antExpenses, input.budgets),
      buildScenario("intensive", "Ahorro intensivo", projectedEndBalance, daysUntilIncome, dailyBurn, 0.55, antExpenses, input.budgets)
    ],
    recurringDetections: recurringSummary(input.recurringPayments)
  };
}
