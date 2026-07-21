import { create } from "zustand";
import {
  Account,
  AiMessage,
  Budget,
  CreditCard,
  ExchangeRates,
  Goal,
  PlannerEvent,
  RecurringPayment,
  Task,
  Transaction
} from "../types/finflow";
import { toBaseCurrency } from "../utils/money";

type FinFlowState = {
  accounts: Account[];
  transactions: Transaction[];
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
  clearFinancialData: () => void;
  loadEmptyFinancialData: () => void;
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

function computeBalance(accounts: Account[], exchangeRates: ExchangeRates) {
  return accounts.reduce((total, account) => total + toBaseCurrency(account.balance, account.currency, exchangeRates), 0);
}

function emptyState() {
  return {
    accounts: [],
    aiMessages: [],
    balance: 0,
    budgets: [],
    creditCards: [],
    error: null,
    events: [],
    exchangeRates: emptyExchangeRates,
    goals: [],
    hasLoaded: true,
    recurringPayments: [],
    tasks: [],
    transactions: []
  };
}

export const useFinFlowStore = create<FinFlowState>()((set, get) => {
  function commit(recipe: (state: FinFlowState) => Partial<FinFlowState>) {
    set((state) => recipe(state));
  }

  return {
    accounts: [],
    transactions: [],
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
    clearFinancialData: () => set(emptyState()),
    loadEmptyFinancialData: () => set(emptyState()),
    addTransaction: () => set({ error: "Transactions must be saved in Supabase. This is enabled in phase 2." }),
    confirmRecurringPayment: (paymentId) =>
      commit((state) => ({
        recurringPayments: state.recurringPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, status: "confirmed" } : payment
        )
      })),
    rejectRecurringPayment: (paymentId) =>
      commit((state) => ({
        recurringPayments: state.recurringPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, status: "rejected" } : payment
        )
      })),
    updateExchangeRate: (currency, value) =>
      commit((state) => {
        const nextRates = { ...state.exchangeRates, [currency]: value };
        return {
          exchangeRates: nextRates,
          balance: computeBalance(state.accounts, nextRates)
        };
      }),
    addTask: () => set({ error: "Tasks must be saved in Supabase. This is enabled in a later phase." }),
    addGoal: () => set({ error: "Goals must be saved in Supabase. This is enabled in phase 2." }),
    addGoalMoney: () => set({ error: "Goals must be saved in Supabase. This is enabled in phase 2." }),
    deleteGoal: () => set({ error: "Goals must be deleted in Supabase. This is enabled in phase 2." }),
    addEvent: () => set({ error: "Events must be saved in Supabase. This is enabled in a later phase." }),
    toggleEventDone: (eventId) =>
      commit((state) => ({
        events: state.events.map((event) => (event.id === eventId ? { ...event, done: !event.done } : event))
      })),
    deleteEvent: (eventId) =>
      commit((state) => ({
        events: state.events.filter((event) => event.id !== eventId)
      })),
    addAiMessage: (message) =>
      commit((state) => ({
        aiMessages: [...state.aiMessages, { ...message, id: makeId("ai") }]
      }))
  };
});
