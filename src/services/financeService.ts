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
};

type TransactionsResponse = {
  transactions: Transaction[];
};

type OverviewResponse = {
  overview: DashboardOverview;
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

export async function createTransactionApi(input: {
  accountId: string;
  categoryId: string;
  type: "income" | "expense";
  title: string;
  merchant?: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
  isAntExpense?: boolean;
}) {
  return apiRequest<TransactionResponse>("/transactions", { body: input, method: "POST", requireAuth: true });
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
