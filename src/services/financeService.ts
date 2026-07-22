import { apiRequest } from "./apiClient";
import { Account, Category, CreditCard, Currency, DashboardOverview, Goal, PlannerEvent, RecurringPayment, Transaction } from "../types/finflow";

type AccountResponse = {
  account: Account;
};

type AccountsResponse = {
  accounts: Account[];
};

type CategoriesResponse = {
  categories: Category[];
};

type TransactionResponse = {
  transaction: Transaction;
  account?: Account;
  accounts?: Account[];
};

type TransactionsResponse = {
  transactions: Transaction[];
};

type OverviewResponse = {
  overview: DashboardOverview;
};

type RecurringPaymentResponse = {
  payment: RecurringPayment;
};

export type ExtendedFinanceResponse = {
  goals: Goal[];
  creditCards: CreditCard[];
  credit_cards?: CreditCard[];
  recurringPayments: RecurringPayment[];
  recurring_payments?: RecurringPayment[];
  events: PlannerEvent[];
};

export async function fetchAccounts() {
  return (await apiRequest<AccountsResponse>("/accounts", { requireAuth: true })).accounts;
}

export async function createAccountApi(input: { name: string; type: string; currency: Currency; initialBalance: number }) {
  return (await apiRequest<AccountResponse>("/accounts", { body: input, method: "POST", requireAuth: true })).account;
}

export async function fetchCategories(type?: "income" | "expense") {
  const query = type ? `?type=${type}` : "";
  return (await apiRequest<CategoriesResponse>(`/categories${query}`, { requireAuth: true })).categories;
}

export async function fetchTransactions() {
  return (await apiRequest<TransactionsResponse>("/transactions", { requireAuth: true })).transactions;
}

export async function fetchTransaction(id: string) {
  return (await apiRequest<TransactionResponse>(`/transactions/${id}`, { requireAuth: true })).transaction;
}

export async function createTransactionApi(input: {
  accountId: string;
  categoryId?: string;
  type: "income" | "expense" | "transfer";
  title: string;
  merchant?: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
  isAntExpense?: boolean;
  paymentMethod?: string;
  installment?: {
    current?: number;
    total?: number;
    amountPerInstallment?: number;
    remainingAmount?: number;
    nextDueDate?: string;
  };
}) {
  return apiRequest<TransactionResponse>("/transactions", { body: input, method: "POST", requireAuth: true });
}

export async function createTransferApi(input: { fromAccountId: string; toAccountId: string; amount: number; currency: Currency; date: string; title?: string; note?: string }) {
  return apiRequest<TransactionResponse>("/transactions/transfer", { body: input, method: "POST", requireAuth: true });
}

export async function updateTransactionApi(id: string, input: Partial<Transaction>) {
  return apiRequest<TransactionResponse>(`/transactions/${id}`, { body: input, method: "PATCH", requireAuth: true });
}

export async function deleteTransactionApi(id: string) {
  return apiRequest<{ account?: Account }>(`/transactions/${id}`, { method: "DELETE", requireAuth: true });
}

export async function fetchOverview(period = "30d") {
  return (await apiRequest<OverviewResponse>(`/statistics/overview?period=${period}`, { requireAuth: true })).overview;
}

export async function fetchExtendedFinance() {
  return apiRequest<ExtendedFinanceResponse>("/finance/extended", { requireAuth: true });
}

export async function createRecurringPaymentApi(input: {
  merchant: string;
  category: string;
  amount: number;
  currency: Currency;
  frequency: "weekly" | "monthly" | "annual";
  nextChargeDate: string;
  kind?: "fixed" | "subscription" | "service";
  accountId?: string;
  notificationsEnabled?: boolean;
}) {
  return (await apiRequest<RecurringPaymentResponse>("/finance/recurring-payments", { body: input, method: "POST", requireAuth: true })).payment;
}
