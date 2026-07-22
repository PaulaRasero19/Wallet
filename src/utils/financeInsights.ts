import { Account, CreditCard, Currency, DashboardOverview, Goal, PlannerEvent, RecurringPayment, Transaction } from "../types/finflow";

export function positiveAmount(transaction: Transaction) {
  return Math.abs(Number(transaction.raw_amount ?? transaction.rawAmount ?? transaction.amount ?? 0));
}

export function accountBalance(account: Account) {
  return Number(account.current_balance ?? account.currentBalance ?? account.balance ?? 0);
}

export function sumAccounts(accounts: Account[], currency: Currency) {
  return accounts.filter((account) => account.currency === currency).reduce((total, account) => total + accountBalance(account), 0);
}

export function sumExpenses(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === "expense").reduce((total, transaction) => total + positiveAmount(transaction), 0);
}

export function sumIncome(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + positiveAmount(transaction), 0);
}

export function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function daysUntilNextPayday(payday?: number | null) {
  const today = new Date();
  const day = payday || 1;
  const next = new Date(today.getFullYear(), today.getMonth(), day, 10, 0, 0, 0);
  if (next <= today) next.setMonth(next.getMonth() + 1);
  const days = Math.ceil((next.getTime() - today.getTime()) / 86400000);
  return { days: Math.max(1, days), date: next };
}

export function monthlyCommitted(recurringPayments: RecurringPayment[], installments: Transaction[]) {
  const recurring = recurringPayments
    .filter((payment) => payment.status !== "rejected")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const installmentTotal = installments.reduce((total, transaction) => total + Number(transaction.installment?.amountPerInstallment || 0), 0);
  return recurring + installmentTotal;
}

export function getInstallments(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.installment);
}

export function getAntExpenses(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === "expense" && (transaction.is_ant_expense || transaction.isAntExpense));
}

export function categorySummary(transactions: Transaction[]) {
  const rows = new Map<string, { name: string; total: number; count: number }>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const name = String(transaction.category || transaction.title || "Otros");
    const current = rows.get(name) || { name, total: 0, count: 0 };
    current.total += positiveAmount(transaction);
    current.count += 1;
    rows.set(name, current);
  }
  const total = [...rows.values()].reduce((sum, row) => sum + row.total, 0);
  return [...rows.values()]
    .map((row) => ({ ...row, percent: percentage(row.total, total) }))
    .sort((a, b) => b.total - a.total);
}

export function nextEvent(events: PlannerEvent[]) {
  return [...events].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))[0] || null;
}

export function buildPriorityInsight(input: {
  available: number;
  dailyLimit: number;
  goal?: Goal;
  salarySpentPercent: number;
  committed: number;
  antTotal: number;
}) {
  if (input.available < 0) return "Tu disponible proyectado está en negativo: evitá gastos variables y revisá pagos comprometidos.";
  if (input.salarySpentPercent > 75) return "Ya usaste más del 75% del sueldo del período. Prioridad: sostener el límite diario.";
  if (input.goal && input.goal.saved / input.goal.target < 0.5) return `Tu meta "${input.goal.name}" va por debajo de la mitad. Separá el aporte apenas cobres.`;
  if (input.antTotal > input.dailyLimit * 3) return "Los gastos hormiga pesan más que varios días de presupuesto. Reducirlos mejora la meta sin tocar gastos fijos.";
  if (input.committed > input.available * 0.6) return "Tenés mucho comprometido para los próximos días. Revisá vencimientos antes de sumar compras.";
  return "Vas ordenada: mantené el límite diario y registrá cada movimiento para sostener la proyección.";
}

export function overviewMetrics(input: {
  accounts: Account[];
  creditCards: CreditCard[];
  events: PlannerEvent[];
  goals: Goal[];
  overview: DashboardOverview | null;
  payday?: number | null;
  primaryCurrency: Currency;
  recurringPayments: RecurringPayment[];
  transactions: Transaction[];
  monthlyIncome: number;
}) {
  const installments = getInstallments(input.transactions);
  const committed = monthlyCommitted(input.recurringPayments, installments);
  const grossAvailable = sumAccounts(input.accounts, input.primaryCurrency);
  const available = grossAvailable - committed;
  const nextPayday = daysUntilNextPayday(input.payday);
  const dailyLimit = Math.max(0, available / nextPayday.days);
  const expenses = Number(input.overview?.expenses || sumExpenses(input.transactions));
  const income = Number(input.overview?.income || sumIncome(input.transactions));
  const antTotal = Number(input.overview?.ant_expense_total || input.overview?.antExpenseTotal || getAntExpenses(input.transactions).reduce((sum, item) => sum + positiveAmount(item), 0));
  const salarySpentPercent = percentage(expenses, input.monthlyIncome || income);
  const goal = input.goals[0];

  return {
    antTotal,
    available,
    committed,
    dailyLimit,
    expenses,
    goal,
    grossAvailable,
    income,
    installments,
    nextPayday,
    nextEvent: nextEvent(input.events),
    priorityInsight: buildPriorityInsight({ available, dailyLimit, goal, salarySpentPercent, committed, antTotal }),
    salarySpentPercent
  };
}
