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
  mask: string;
  balance: number;
  currency: Currency;
  accent: AccentColor;
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
  currency: Currency;
  type: TransactionType;
  accent: AccentColor;
  accountId?: string;
  weekday?: string;
  hour?: number;
  isAntExpense?: boolean;
  installment?: Installment;
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
