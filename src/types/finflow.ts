import { AccentColor } from "../theme";

export type TransactionType = "income" | "expense" | "transfer";
export type BudgetCategory = "Housing" | "Food" | "Transport" | "Shopping" | "Entertainment" | "Other";
export type Currency = "UYU" | "USD" | "EUR";
export type RecurringStatus = "pending" | "confirmed" | "rejected";

export type User = {
  name: string;
  email: string;
  nextIncomeDate: string;
};

export type Account = {
  id: string;
  name: string;
  mask?: string;
  type?: "cash" | "bank" | "savings" | "wallet" | "credit" | "other";
  balance: number;
  currentBalance?: number;
  current_balance?: number;
  initialBalance?: number;
  initial_balance?: number;
  currency: Currency;
  accent?: AccentColor;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  translationKey?: string;
  translation_key?: string;
  isSystem?: boolean;
  is_system?: boolean;
};

export type Installment = {
  current: number;
  total: number;
  amountPerInstallment: number;
  remainingAmount: number;
  nextDueDate: string;
};

export type Transaction = {
  id: string;
  merchant: string;
  category: BudgetCategory | "Salary" | "Freelance";
  date: string;
  time: string;
  amount: number;
  rawAmount?: number;
  raw_amount?: number;
  currency: Currency;
  type: TransactionType;
  accent: AccentColor;
  accountId?: string;
  account_id?: string;
  categoryId?: string;
  category_id?: string;
  title?: string;
  note?: string;
  weekday?: string;
  hour?: number;
  isRecurring?: boolean;
  is_recurring?: boolean;
  isAntExpense?: boolean;
  is_ant_expense?: boolean;
  installment?: Installment;
};

export type DailyHistoryPoint = {
  date: string;
  income: number;
  expenses: number;
  closingBalance: number;
};

export type DashboardOverview = {
  period: string;
  accounts: Account[];
  balancesByCurrency?: Record<Currency, number>;
  balances_by_currency?: Record<Currency, number>;
  income: number;
  expenses: number;
  net: number;
  transactionCount?: number;
  transaction_count?: number;
  averageDailyExpense?: number;
  average_daily_expense?: number;
  topExpenseCategory?: { categoryId: string; total: number } | null;
  top_expense_category?: { category_id: string; total: number } | null;
  recentTransactions?: Transaction[];
  recent_transactions?: Transaction[];
  antExpenseTotal?: number;
  ant_expense_total?: number;
  history: DailyHistoryPoint[];
};

export type Budget = {
  id: string;
  name: BudgetCategory;
  spent: number;
  limit: number;
  currency: Currency;
  accent: AccentColor;
};

export type Goal = {
  id: string;
  name: string;
  saved: number;
  target: number;
  currency: Currency;
  monthlyContribution: number;
  accent: AccentColor;
};

export type RecurringPayment = {
  id: string;
  merchant: string;
  category: BudgetCategory | "Other";
  amount: number;
  currency: Currency;
  frequency: "weekly" | "monthly" | "annual";
  nextChargeDate: string;
  status: RecurringStatus;
  kind: "fixed" | "subscription" | "service";
  confidence: number;
  priceChange?: number;
  duplicateGroup?: string;
};

export type CreditCard = {
  id: string;
  name: string;
  mask: string;
  currency: Currency;
  limit: number;
  used: number;
  closingDate: string;
  dueDate: string;
  accent: AccentColor;
};

export type ExchangeRates = Record<Currency, number>;

export type PlannerEvent = {
  id: string;
  title: string;
  date?: string;
  time: string;
  category: string;
  done: boolean;
  accent: AccentColor;
};

export type Task = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  reminder: boolean;
  note: string;
  accent: AccentColor;
};

export type AiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  progress?: number;
};

export type MovementProposal = {
  type: TransactionType | "task";
  merchant: string;
  amount: number;
  currency: Currency;
  category: BudgetCategory | "Salary" | "Freelance" | "Other";
  date: string;
  accountId: string;
  installments?: Installment;
  isAntExpense: boolean;
  reminderText?: string;
};
