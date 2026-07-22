import { Transaction } from "../types/finflow";

function positiveAmount(transaction: Transaction) {
  return Math.abs(Number(transaction.rawAmount ?? transaction.raw_amount ?? transaction.amount ?? 0));
}

export type MovementSummary = {
  actualIncome: number;
  balance: number;
  grossExpenses: number;
  includedExpenses: Transaction[];
  includedIncome: Transaction[];
  includedRefunds: Transaction[];
  netExpenses: number;
  refunds: number;
};

type MovementSummaryInput = {
  selectedMonth?: Date;
  transactions: Transaction[];
  userId?: string;
};

function monthRange(selectedMonth = new Date()) {
  const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1, 0, 0, 0, 0);
  return { end, start };
}

function isCompletedIncome(transaction: Transaction) {
  const status = transaction.status || transaction.transactionStatus || transaction.transaction_status;
  return status === "completed" || status === "received";
}

function isCompletedExpense(transaction: Transaction) {
  const status = transaction.status || transaction.transactionStatus || transaction.transaction_status;
  return status === "completed" || status === "paid";
}

function belongsToUser(transaction: Transaction, userId?: string) {
  if (!userId) return true;
  return (transaction.userId || transaction.user_id) === userId;
}

function isInMonth(transaction: Transaction, selectedMonth?: Date) {
  const { end, start } = monthRange(selectedMonth);
  const time = new Date(transaction.date).getTime();
  return Number.isFinite(time) && time >= start.getTime() && time < end.getTime();
}

function isRefund(transaction: Transaction) {
  if (transaction.type === "refund") return true;
  if (transaction.type !== "income") return false;
  const text = [transaction.title, transaction.merchant, transaction.note, transaction.category].filter(Boolean).join(" ").toLowerCase();
  return ["reintegro", "devolucion", "devolución", "refund"].some((keyword) => text.includes(keyword));
}

function isExcludedMovementType(transaction: Transaction) {
  return transaction.type === "transfer" || transaction.type === "internal_transfer" || transaction.type === "goal_contribution";
}

export function calculateMovementSummary({ selectedMonth, transactions, userId }: MovementSummaryInput): MovementSummary {
  const realTransactions = transactions.filter((transaction) => {
    if (!belongsToUser(transaction, userId) || !isInMonth(transaction, selectedMonth) || isExcludedMovementType(transaction)) return false;
    if (transaction.type === "income" || transaction.type === "refund") return isCompletedIncome(transaction);
    if (transaction.type === "expense") return isCompletedExpense(transaction);
    return false;
  });
  const includedRefunds = realTransactions.filter(isRefund);
  const includedIncome = realTransactions.filter((transaction) => transaction.type === "income" && !isRefund(transaction));
  const includedExpenses = realTransactions.filter((transaction) => transaction.type === "expense");
  const actualIncome = includedIncome.reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const grossExpenses = includedExpenses.reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const refunds = includedRefunds.reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const netExpenses = Math.max(0, grossExpenses - refunds);

  return {
    actualIncome,
    balance: actualIncome - netExpenses,
    grossExpenses,
    includedExpenses,
    includedIncome,
    includedRefunds,
    netExpenses,
    refunds
  };
}

export function calculateCompletedMonthlyTransactions(input: MovementSummaryInput) {
  const summary = calculateMovementSummary(input);
  return { income: summary.actualIncome, expenses: summary.netExpenses, balance: summary.balance };
}
