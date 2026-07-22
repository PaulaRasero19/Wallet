import { Types } from "mongoose";
import { Account } from "../models/Account";
import { Transaction } from "../models/Transaction";
import { accountDTO, transactionDTO } from "./serializers";

const periodDays: Record<string, number> = {
  "1d": 1,
  "1w": 7,
  "1m": 30,
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function balanceImpact(type: string, amount: number) {
  if (type === "income") return amount;
  if (type === "expense") return -amount;
  return 0;
}

export async function getOverview(userId: Types.ObjectId, period = "30d") {
  let days = periodDays[period] || 30;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));

  const [accounts, transactions] = await Promise.all([
    Account.find({ userId, isActive: true }).sort({ createdAt: 1 }),
    Transaction.find({ userId }).sort({ date: 1 })
  ]);

  if (period === "all" && transactions.length) {
    from.setTime(transactions[0].date.getTime());
    from.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    days = Math.max(1, Math.round((today.getTime() - from.getTime()) / 86400000) + 1);
  }

  const periodTransactions = transactions.filter((transaction) => transaction.date >= from);
  const recentTransactions = [...periodTransactions].slice(-100).reverse();

  const totalByCurrency = accounts.reduce<Record<string, number>>((acc, account) => {
    acc[account.currency] = (acc[account.currency] || 0) + account.currentBalance;
    return acc;
  }, {});

  const income = periodTransactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
  const expenses = periodTransactions.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
  const antExpenses = periodTransactions.filter((item) => item.isAntExpense).reduce((total, item) => total + item.amount, 0);

  const expenseByCategory = new Map<string, number>();
  for (const transaction of periodTransactions) {
    if (transaction.type === "expense" && transaction.categoryId) {
      const key = transaction.categoryId.toString();
      expenseByCategory.set(key, (expenseByCategory.get(key) || 0) + transaction.amount);
    }
  }
  const topCategory = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1])[0] || null;

  const history = Array.from({ length: days }, (_, index) => {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    const key = dayKey(date);
    const daily = transactions.filter((item) => dayKey(item.date) === key);
    const dailyIncome = daily.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
    const dailyExpenses = daily.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
    const closingBalance = transactions
      .filter((item) => item.date <= date)
      .reduce((total, item) => total + balanceImpact(item.type, item.amount), 0);

    return { date: key, income: dailyIncome, expenses: dailyExpenses, closingBalance };
  });

  return {
    period,
    accounts: accounts.map(accountDTO),
    balancesByCurrency: totalByCurrency,
    balances_by_currency: totalByCurrency,
    income,
    expenses,
    net: income - expenses,
    transactionCount: periodTransactions.length,
    transaction_count: periodTransactions.length,
    averageDailyExpense: expenses / days,
    average_daily_expense: expenses / days,
    topExpenseCategory: topCategory ? { categoryId: topCategory[0], total: topCategory[1] } : null,
    top_expense_category: topCategory ? { category_id: topCategory[0], total: topCategory[1] } : null,
    recentTransactions: recentTransactions.slice(0, 5).map(transactionDTO),
    recent_transactions: recentTransactions.slice(0, 5).map(transactionDTO),
    antExpenseTotal: antExpenses,
    ant_expense_total: antExpenses,
    history
  };
}
