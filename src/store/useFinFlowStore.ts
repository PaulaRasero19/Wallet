import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  mockAccounts,
  mockBudgets,
  mockCreditCards,
  mockExchangeRates,
  mockEvents,
  mockGoals,
  mockMessages,
  mockRecurringPayments,
  mockTransactions,
  mockUser
} from "../data/mock";
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
  Transaction,
  User
} from "../types/finflow";
import { toBaseCurrency } from "../utils/money";

type FinFlowState = {
  user: User;
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
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
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

const STORAGE_KEY = "finflow-store";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function computeBalance(accounts: Account[], exchangeRates: ExchangeRates) {
  return accounts.reduce((total, account) => total + toBaseCurrency(account.balance, account.currency, exchangeRates), 0);
}

function snapshot(state: FinFlowState) {
  return {
    accounts: state.accounts,
    aiMessages: state.aiMessages,
    balance: state.balance,
    budgets: state.budgets,
    creditCards: state.creditCards,
    events: state.events,
    exchangeRates: state.exchangeRates,
    goals: state.goals,
    recurringPayments: state.recurringPayments,
    tasks: state.tasks,
    transactions: state.transactions,
    user: state.user
  };
}

function normalizeStoredState(rawState: Partial<FinFlowState>) {
  const exchangeRates = rawState.exchangeRates || mockExchangeRates;

  return {
    accounts: rawState.accounts?.map((account) => ({ ...account, currency: account.currency || "UYU" })) || mockAccounts,
    aiMessages: rawState.aiMessages || mockMessages,
    budgets: rawState.budgets?.map((budget) => ({ ...budget, currency: budget.currency || "UYU" })) || mockBudgets,
    creditCards: rawState.creditCards || mockCreditCards,
    events: rawState.events || mockEvents,
    exchangeRates,
    goals:
      rawState.goals?.map((goal) => ({
        ...goal,
        currency: goal.currency || "UYU",
        monthlyContribution: goal.monthlyContribution || 0
      })) || mockGoals,
    recurringPayments: rawState.recurringPayments || mockRecurringPayments,
    tasks: rawState.tasks || [],
    transactions:
      rawState.transactions?.map((transaction) => ({
        ...transaction,
        currency: transaction.currency || "UYU"
      })) || mockTransactions,
    user: rawState.user ? { ...mockUser, ...rawState.user } : mockUser
  };
}

export const useFinFlowStore = create<FinFlowState>()((set, get) => {
  async function save() {
    const state = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(state)));
  }

  function commit(recipe: (state: FinFlowState) => Partial<FinFlowState>) {
    set((state) => recipe(state));
    void save();
  }

  return {
    user: mockUser,
    accounts: mockAccounts,
    transactions: mockTransactions,
    budgets: mockBudgets,
    creditCards: mockCreditCards,
    exchangeRates: mockExchangeRates,
    goals: mockGoals,
    recurringPayments: mockRecurringPayments,
    events: mockEvents,
    tasks: [],
    aiMessages: mockMessages,
    balance: computeBalance(mockAccounts, mockExchangeRates),
    hasHydrated: false,
    hydrate: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const normalizedState = normalizeStoredState(JSON.parse(stored));
        set({
          ...normalizedState,
          balance: computeBalance(normalizedState.accounts, normalizedState.exchangeRates),
          hasHydrated: true
        });
        return;
      }
      set({ hasHydrated: true });
    },
    addTransaction: (transaction) =>
      commit((state) => {
        const nextTransaction = { ...transaction, id: makeId("txn") };
        const nextAccounts = state.accounts.map((account, index) =>
          index === 0 ? { ...account, balance: account.balance + transaction.amount } : account
        );
        const nextBudgets =
          transaction.type === "expense"
            ? state.budgets.map((budget) =>
                budget.name === transaction.category
                  ? { ...budget, spent: budget.spent + Math.abs(transaction.amount) }
                  : budget
              )
            : state.budgets;

        return {
          accounts: nextAccounts,
          balance: computeBalance(nextAccounts, state.exchangeRates),
          budgets: nextBudgets,
          transactions: [nextTransaction, ...state.transactions]
        };
      }),
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
    addTask: (task) =>
      commit((state) => ({
        tasks: [{ ...task, id: makeId("task") }, ...state.tasks]
      })),
    addGoal: (goal) =>
      commit((state) => ({
        goals: [{ ...goal, id: makeId("goal") }, ...state.goals]
      })),
    addGoalMoney: (goalId, amount) =>
      commit((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === goalId ? { ...goal, saved: Math.min(goal.target, goal.saved + amount) } : goal
        )
      })),
    deleteGoal: (goalId) =>
      commit((state) => ({
        goals: state.goals.filter((goal) => goal.id !== goalId)
      })),
    addEvent: (event) =>
      commit((state) => ({
        events: [...state.events, { ...event, id: makeId("event") }]
      })),
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
