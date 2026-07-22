import { apiRequest } from "./apiClient";
import { Account, Category, CreditCard, Currency, DashboardOverview, Goal, InstallmentPurchase, PlannerEvent, RecurringPayment, Transaction } from "../types/finflow";

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

type GoalResponse = {
  goal: Goal;
};

type InstallmentPurchaseResponse = {
  purchase: InstallmentPurchase;
};

export type ExtendedFinanceResponse = {
  goals: Goal[];
  creditCards: CreditCard[];
  credit_cards?: CreditCard[];
  installmentPurchases?: InstallmentPurchase[];
  installment_purchases?: InstallmentPurchase[];
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

export async function createCategoryApi(input: { name: string; type: "income" | "expense"; icon: string; color: string }) {
  return (await apiRequest<{ category: Category }>("/categories", { body: input, method: "POST", requireAuth: true })).category;
}

export async function fetchTransactions(filters: { dateFrom?: string; dateTo?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return (await apiRequest<TransactionsResponse>(`/transactions${query}`, { requireAuth: true })).transactions;
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
  scheduledPaymentId?: string;
  receiptUrl?: string;
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
  frequency: "once" | "weekly" | "monthly" | "annual";
  reminderDaysBefore?: number;
  nextChargeDate: string;
  kind?: "fixed" | "subscription" | "service";
  accountId?: string;
  notificationsEnabled?: boolean;
  categoryId?: string;
}) {
  return (await apiRequest<RecurringPaymentResponse>("/finance/recurring-payments", { body: input, method: "POST", requireAuth: true })).payment;
}

export async function createGoalApi(input: { name: string; target: number; saved?: number; currency: Currency; monthlyContribution?: number; targetDate?: string | null }) {
  return (await apiRequest<GoalResponse>("/finance/goals", { body: input, method: "POST", requireAuth: true })).goal;
}

export async function createInstallmentPurchaseApi(input: {
  accountId?: string;
  name: string;
  totalAmount: number;
  totalInstallments: number;
  firstDueDate: string;
  category: string;
  currency: Currency;
  reminderDaysBefore?: number;
}) {
  return (await apiRequest<InstallmentPurchaseResponse>("/finance/installment-purchases", { body: input, method: "POST", requireAuth: true })).purchase;
}

export async function markRecurringPaymentPaidApi(id: string) {
  return apiRequest<{ payment: RecurringPayment; transactionId: string }>(`/finance/recurring-payments/${id}/pay`, { method: "POST", requireAuth: true });
}

export async function markInstallmentPaidApi(purchaseId: string, installmentId: string) {
  return (await apiRequest<InstallmentPurchaseResponse>(`/finance/installment-purchases/${purchaseId}/installments/${installmentId}/pay`, { method: "POST", requireAuth: true })).purchase;
}
