import { create } from "zustand";
import {
  completeNotificationApi,
  fetchNotifications,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  scheduleLocalPaymentNotifications,
  snoozeNotificationApi
} from "../services/notificationsService";
import {
  addGoalMoneyApi,
  deleteGoalApi,
  createAccountApi,
  createCategoryApi,
  createRecurringPaymentApi,
  createGoalApi,
  createInstallmentPurchaseApi,
  createTransferApi,
  createTransactionApi,
  deleteTransactionApi,
  fetchAccounts,
  fetchCategories,
  fetchExtendedFinance,
  fetchOverview,
  fetchTransactions,
  markInstallmentPaidApi,
  markRecurringPaymentPaidApi,
  updateGoalApi,
  updateTransactionApi
} from "../services/financeService";
import {
  Account,
  AiMessage,
  Budget,
  Category,
  CreditCard,
  Currency,
  DashboardOverview,
  ExchangeRates,
  FinFlowNotification,
  Goal,
  InstallmentPurchase,
  PlannerEvent,
  RecurringPayment,
  Task,
  Transaction
} from "../types/finflow";

type TransactionInput = {
  accountId: string;
  categoryId?: string;
  type: "income" | "expense" | "transfer";
  title: string;
  merchant?: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
  isRecurring?: boolean;
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
  clientRequestId?: string;
};

type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: Currency;
  date: string;
  title?: string;
  note?: string;
};

type RecurringPaymentInput = {
  merchant: string;
  category: string;
  amount: number;
  currency: Currency;
  frequency: "once" | "weekly" | "fortnightly" | "monthly" | "annual";
  nextChargeDate: string;
  kind?: "fixed" | "subscription" | "service" | "income";
  accountId?: string;
  notificationsEnabled?: boolean;
  reminderDaysBefore?: number;
  categoryId?: string;
};

type GoalInput = {
  name: string;
  target: number;
  saved?: number;
  currency: Currency;
  targetDate?: string | null;
};

type InstallmentPurchaseInput = {
  accountId?: string;
  name: string;
  totalAmount: number;
  totalInstallments: number;
  firstDueDate: string;
  category: string;
  cardName: string;
  note?: string;
  currency: Currency;
  reminderDaysBefore?: number;
};

type AccountInput = {
  name: string;
  type: string;
  currency: Currency;
  initialBalance: number;
};

type FinFlowState = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  overview: DashboardOverview | null;
  loading: boolean;
  errors: string | null;
  budgets: Budget[];
  creditCards: CreditCard[];
  exchangeRates: ExchangeRates;
  goals: Goal[];
  installmentPurchases: InstallmentPurchase[];
  recurringPayments: RecurringPayment[];
  events: PlannerEvent[];
  tasks: Task[];
  notifications: FinFlowNotification[];
  aiMessages: AiMessage[];
  balance: number;
  error: string | null;
  hasLoaded: boolean;
  clear: () => void;
  clearFinancialData: () => void;
  loadEmptyFinancialData: () => void;
  loadAccounts: () => Promise<void>;
  loadCategories: (type?: "income" | "expense") => Promise<void>;
  createAccount: (input: AccountInput) => Promise<Account>;
  createCategory: (input: { name: string; type: "income" | "expense"; icon: string; color: string }) => Promise<Category>;
  loadTransactions: (filters?: { dateFrom?: string; dateTo?: string; limit?: number }) => Promise<void>;
  createTransaction: (input: TransactionInput) => Promise<Transaction>;
  createTransfer: (input: TransferInput) => Promise<Transaction>;
  createRecurringPayment: (input: RecurringPaymentInput) => Promise<RecurringPayment>;
  createGoal: (input: GoalInput) => Promise<Goal>;
  createInstallmentPurchase: (input: InstallmentPurchaseInput) => Promise<InstallmentPurchase>;
  markPaymentPaid: (id: string) => Promise<void>;
  markInstallmentPaid: (purchaseId: string, installmentId: string) => Promise<void>;
  updateTransaction: (id: string, input: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  loadOverview: (period?: string) => Promise<void>;
  loadNotifications: (status?: "pending" | "read") => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  snoozeNotification: (id: string) => Promise<void>;
  completeNotification: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  confirmRecurringPayment: (paymentId: string) => void;
  rejectRecurringPayment: (paymentId: string) => void;
  updateExchangeRate: (currency: keyof ExchangeRates, value: number) => void;
  addTask: (task: Omit<Task, "id">) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  addGoalMoney: (goalId: string, amount: number) => Promise<void>;
  updateGoal: (goalId: string, input: Partial<Pick<Goal, "name" | "target" | "saved" | "targetDate" | "status">>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addEvent: (event: Omit<PlannerEvent, "id">) => void;
  toggleEventDone: (eventId: string) => void;
  deleteEvent: (eventId: string) => void;
  addAiMessage: (message: Omit<AiMessage, "id">) => void;
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

const emptyExchangeRates: ExchangeRates = {
  UYU: 1,
  USD: 1,
  EUR: 1
};

function getBalance(accounts: Account[]) {
  return accounts.reduce((total, account) => total + Number(account.current_balance ?? account.currentBalance ?? account.balance ?? 0), 0);
}

function emptyState() {
  return {
    accounts: [],
    aiMessages: [],
    balance: 0,
    budgets: [],
    categories: [],
    creditCards: [],
    error: null,
    errors: null,
    events: [],
    exchangeRates: emptyExchangeRates,
    goals: [],
    installmentPurchases: [],
    hasLoaded: true,
    loading: false,
    notifications: [],
    overview: null,
    recurringPayments: [],
    tasks: [],
    transactions: []
  };
}

export const useFinFlowStore = create<FinFlowState>()((set, get) => {
  function fail(error: unknown): never {
    const message = error instanceof Error ? error.message : "No se pudo cargar la información financiera.";
    set({ error: message, errors: message, loading: false });
    throw error;
  }

  return {
    accounts: [],
    transactions: [],
    categories: [],
    overview: null,
    loading: false,
    notifications: [],
    errors: null,
    budgets: [],
    creditCards: [],
    exchangeRates: emptyExchangeRates,
    goals: [],
    installmentPurchases: [],
    recurringPayments: [],
    events: [],
    tasks: [],
    aiMessages: [],
    balance: 0,
    error: null,
    hasLoaded: false,
    clear: () => set(emptyState()),
    clearFinancialData: () => set(emptyState()),
    loadEmptyFinancialData: () => set(emptyState()),
    loadAccounts: async () => {
      set({ loading: true, error: null, errors: null });
      try {
        const accounts = await fetchAccounts();
        set({ accounts, balance: getBalance(accounts), hasLoaded: true, loading: false });
      } catch (error) {
        fail(error);
      }
    },
    loadCategories: async (type) => {
      set({ loading: true, error: null, errors: null });
      try {
        const categories = await fetchCategories(type);
        set({ categories, loading: false });
      } catch (error) {
        fail(error);
      }
    },
    createAccount: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const account = await createAccountApi(input);
        const accounts = [...get().accounts, account];
        set({ accounts, balance: getBalance(accounts), loading: false });
        return account;
      } catch (error) {
        fail(error);
      }
    },
    createCategory: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const category = await createCategoryApi(input);
        set({ categories: [...get().categories, category], loading: false });
        return category;
      } catch (error) {
        fail(error);
      }
    },
    loadTransactions: async (filters = {}) => {
      set({ loading: true, error: null, errors: null });
      try {
        const transactions = await fetchTransactions(filters);
        set({ transactions, hasLoaded: true, loading: false });
      } catch (error) {
        fail(error);
      }
    },
    createTransaction: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const request = {
          ...input,
          clientRequestId: input.clientRequestId || `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        };
        const result = await createTransactionApi(request);
        const transactions = [result.transaction, ...get().transactions];
        const accounts = result.account ? get().accounts.map((account) => (account.id === result.account?.id ? result.account : account)) : get().accounts;
        set({ accounts, transactions, balance: getBalance(accounts), loading: false });
        await get().loadOverview();
        return result.transaction;
      } catch (error) {
        fail(error);
      }
    },
    createTransfer: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const result = await createTransferApi(input);
        const transactions = [result.transaction, ...get().transactions];
        const updatedAccounts = result.accounts || [];
        const accounts = updatedAccounts.length
          ? get().accounts.map((account) => updatedAccounts.find((updated) => updated.id === account.id) || account)
          : get().accounts;
        set({ accounts, transactions, balance: getBalance(accounts), loading: false });
        await get().loadOverview();
        return result.transaction;
      } catch (error) {
        fail(error);
      }
    },
    createRecurringPayment: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const payment = await createRecurringPaymentApi(input);
        set({ recurringPayments: [...get().recurringPayments, payment], loading: false });
        if (input.notificationsEnabled !== false) {
          await scheduleLocalPaymentNotifications({
            body: `${payment.merchant} por ${payment.amount.toLocaleString("es-UY")} vence el ${new Date(payment.nextChargeDate).toLocaleDateString("es-UY")}.`,
            data: { id: payment.id, relatedEntityId: payment.id, relatedEntityType: "payment" },
            dueDate: payment.nextChargeDate,
            reminderDaysBefore: payment.reminderDaysBefore ?? 1,
            title: `${payment.merchant} vence pronto`
          }).catch(() => undefined);
        }
        await get().loadNotifications("pending");
        return payment;
      } catch (error) {
        fail(error);
      }
    },
    createGoal: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const goal = await createGoalApi(input);
        set({ goals: [...get().goals, goal], loading: false });
        return goal;
      } catch (error) {
        fail(error);
      }
    },
    createInstallmentPurchase: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const purchase = await createInstallmentPurchaseApi(input);
        set({ installmentPurchases: [...get().installmentPurchases, purchase], loading: false });
        await get().loadNotifications("pending");
        return purchase;
      } catch (error) {
        fail(error);
      }
    },
    markPaymentPaid: async (id) => {
      set({ loading: true, error: null, errors: null });
      try {
        const result = await markRecurringPaymentPaidApi(id);
        set({
          recurringPayments: get().recurringPayments.map((payment) => (payment.id === id ? result.payment : payment)).filter((payment) => payment.active !== false),
          loading: false
        });
        await get().loadOverview();
        await get().loadTransactions({ limit: 500 });
        await get().loadNotifications("pending");
      } catch (error) {
        fail(error);
      }
    },
    markInstallmentPaid: async (purchaseId, installmentId) => {
      set({ loading: true, error: null, errors: null });
      try {
        const purchase = await markInstallmentPaidApi(purchaseId, installmentId);
        set({ installmentPurchases: get().installmentPurchases.map((item) => (item.id === purchaseId ? purchase : item)), loading: false });
        await get().loadOverview();
        await get().loadTransactions({ limit: 500 });
        await get().loadNotifications("pending");
      } catch (error) {
        fail(error);
      }
    },
    updateTransaction: async (id, input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const result = await updateTransactionApi(id, input);
        const transactions = get().transactions.map((transaction) => (transaction.id === id ? result.transaction : transaction));
        const accounts = result.account ? get().accounts.map((account) => (account.id === result.account?.id ? result.account : account)) : get().accounts;
        set({ accounts, transactions, balance: getBalance(accounts), loading: false });
        await get().loadOverview();
        return result.transaction;
      } catch (error) {
        fail(error);
      }
    },
    deleteTransaction: async (id) => {
      set({ loading: true, error: null, errors: null });
      try {
        const result = await deleteTransactionApi(id);
        const transactions = get().transactions.filter((transaction) => transaction.id !== id);
        const accounts = result.account ? get().accounts.map((account) => (account.id === result.account?.id ? result.account : account)) : get().accounts;
        set({ accounts, transactions, balance: getBalance(accounts), loading: false });
        await get().loadOverview();
      } catch (error) {
        fail(error);
      }
    },
    loadOverview: async (period = "30d") => {
      set({ loading: true, error: null, errors: null });
      try {
        const [overview, extended] = await Promise.all([fetchOverview(period), fetchExtendedFinance()]);
        const accounts = overview.accounts || get().accounts;
        const transactions = get().transactions.length ? get().transactions : overview.recent_transactions || overview.recentTransactions || [];
        set({
          accounts,
          balance: getBalance(accounts),
          creditCards: extended.creditCards || extended.credit_cards || [],
          events: extended.events || [],
          goals: extended.goals || [],
          installmentPurchases: extended.installmentPurchases || extended.installment_purchases || [],
          overview,
          recurringPayments: extended.recurringPayments || extended.recurring_payments || [],
          transactions,
          hasLoaded: true,
          loading: false
        });
      } catch (error) {
        fail(error);
      }
    },
    loadNotifications: async (status) => {
      try {
        const notifications = await fetchNotifications(status);
        set({ notifications });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudieron cargar las notificaciones.";
        set({ error: message, errors: message });
      }
    },
    markNotificationRead: async (id) => {
      const notification = await markNotificationReadApi(id);
      if (!notification) return;
      set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? notification : item)) }));
    },
    markAllNotificationsRead: async () => {
      await markAllNotificationsReadApi();
      set((state) => ({ notifications: state.notifications.map((item) => (item.status === "pending" ? { ...item, status: "read", readAt: new Date().toISOString() } : item)) }));
    },
    snoozeNotification: async (id) => {
      const notification = await snoozeNotificationApi(id);
      if (!notification) return;
      set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? notification : item)) }));
    },
    completeNotification: async (id) => {
      const notification = await completeNotificationApi(id);
      if (!notification) return;
      set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? notification : item)) }));
    },
    addTransaction: () => set({ error: "Usá createTransaction para guardar movimientos reales en MongoDB.", errors: "Usá createTransaction para guardar movimientos reales en MongoDB." }),
    confirmRecurringPayment: (paymentId) =>
      set((state) => ({
        recurringPayments: state.recurringPayments.map((payment) => (payment.id === paymentId ? { ...payment, status: "confirmed" } : payment))
      })),
    rejectRecurringPayment: (paymentId) =>
      set((state) => ({
        recurringPayments: state.recurringPayments.map((payment) => (payment.id === paymentId ? { ...payment, status: "rejected" } : payment))
      })),
    updateExchangeRate: (currency, value) => set((state) => ({ exchangeRates: { ...state.exchangeRates, [currency]: value } })),
    addTask: () => set({ error: "Planner queda para el siguiente bloque.", errors: "Planner queda para el siguiente bloque." }),
    addGoal: () => set({ error: "Metas queda para el siguiente bloque.", errors: "Metas queda para el siguiente bloque." }),
    addGoalMoney: async (goalId, amount) => {
      set({ loading: true, error: null, errors: null });
      try {
        const goal = await addGoalMoneyApi(goalId, amount);
        set({ goals: get().goals.map((item) => item.id === goalId ? goal : item), loading: false });
      } catch (error) {
        fail(error);
      }
    },
    updateGoal: async (goalId, input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const goal = await updateGoalApi(goalId, input);
        set({ goals: get().goals.map((item) => item.id === goalId ? goal : item), loading: false });
      } catch (error) { fail(error); }
    },
    deleteGoal: async (goalId) => {
      set({ loading: true, error: null, errors: null });
      try {
        await deleteGoalApi(goalId);
        set({ goals: get().goals.filter((item) => item.id !== goalId), loading: false });
      } catch (error) { fail(error); }
    },
    addEvent: () => set({ error: "Planner queda para el siguiente bloque.", errors: "Planner queda para el siguiente bloque." }),
    toggleEventDone: (eventId) => set((state) => ({ events: state.events.map((event) => (event.id === eventId ? { ...event, done: !event.done } : event)) })),
    deleteEvent: (eventId) => set((state) => ({ events: state.events.filter((event) => event.id !== eventId) })),
    addAiMessage: (message) => set((state) => ({ aiMessages: [...state.aiMessages, { ...message, id: makeId("ai") }] }))
  };
});
