import { create } from "zustand";
import {
  createAccountApi,
  createTransactionApi,
  deleteTransactionApi,
  fetchAccounts,
  fetchCategories,
  fetchExtendedFinance,
  fetchOverview,
  fetchTransactions,
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
  Goal,
  PlannerEvent,
  RecurringPayment,
  Task,
  Transaction
} from "../types/finflow";

type TransactionInput = {
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
  recurringPayments: RecurringPayment[];
  events: PlannerEvent[];
  tasks: Task[];
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
  loadTransactions: () => Promise<void>;
  createTransaction: (input: TransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  loadOverview: (period?: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  confirmRecurringPayment: (paymentId: string) => void;
  rejectRecurringPayment: (paymentId: string) => void;
  updateExchangeRate: (currency: keyof ExchangeRates, value: number) => void;
  addTask: (task: Omit<Task, "id">) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  addGoalMoney: (goalId: string, amount: number) => void;
  deleteGoal: (goalId: string) => void;
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
    hasLoaded: true,
    loading: false,
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
    errors: null,
    budgets: [],
    creditCards: [],
    exchangeRates: emptyExchangeRates,
    goals: [],
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
    loadTransactions: async () => {
      set({ loading: true, error: null, errors: null });
      try {
        const transactions = await fetchTransactions();
        set({ transactions, hasLoaded: true, loading: false });
      } catch (error) {
        fail(error);
      }
    },
    createTransaction: async (input) => {
      set({ loading: true, error: null, errors: null });
      try {
        const result = await createTransactionApi(input);
        const transactions = [result.transaction, ...get().transactions];
        const accounts = result.account ? get().accounts.map((account) => (account.id === result.account?.id ? result.account : account)) : get().accounts;
        set({ accounts, transactions, balance: getBalance(accounts), loading: false });
        await get().loadOverview();
        return result.transaction;
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
        const transactions = overview.recent_transactions || overview.recentTransactions || get().transactions;
        set({
          accounts,
          balance: getBalance(accounts),
          creditCards: extended.creditCards || extended.credit_cards || [],
          events: extended.events || [],
          goals: extended.goals || [],
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
    addGoalMoney: () => set({ error: "Metas queda para el siguiente bloque.", errors: "Metas queda para el siguiente bloque." }),
    deleteGoal: () => set({ error: "Metas queda para el siguiente bloque.", errors: "Metas queda para el siguiente bloque." }),
    addEvent: () => set({ error: "Planner queda para el siguiente bloque.", errors: "Planner queda para el siguiente bloque." }),
    toggleEventDone: (eventId) => set((state) => ({ events: state.events.map((event) => (event.id === eventId ? { ...event, done: !event.done } : event)) })),
    deleteEvent: (eventId) => set((state) => ({ events: state.events.filter((event) => event.id !== eventId) })),
    addAiMessage: (message) => set((state) => ({ aiMessages: [...state.aiMessages, { ...message, id: makeId("ai") }] }))
  };
});
