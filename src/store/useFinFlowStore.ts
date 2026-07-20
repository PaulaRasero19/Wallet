import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  mockAccounts,
  mockBudgets,
  mockEvents,
  mockGoals,
  mockMessages,
  mockTransactions,
  mockUser
} from "../data/mock";
import { Account, AiMessage, Budget, Goal, PlannerEvent, Task, Transaction, User } from "../types/finflow";

type FinFlowState = {
  user: User;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  events: PlannerEvent[];
  tasks: Task[];
  aiMessages: AiMessage[];
  balance: number;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
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

function computeBalance(accounts: Account[]) {
  return accounts.reduce((total, account) => total + account.balance, 0);
}

function snapshot(state: FinFlowState) {
  return {
    accounts: state.accounts,
    aiMessages: state.aiMessages,
    balance: state.balance,
    budgets: state.budgets,
    events: state.events,
    goals: state.goals,
    tasks: state.tasks,
    transactions: state.transactions,
    user: state.user
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
    goals: mockGoals,
    events: mockEvents,
    tasks: [],
    aiMessages: mockMessages,
    balance: computeBalance(mockAccounts),
    hasHydrated: false,
    hydrate: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ ...JSON.parse(stored), hasHydrated: true });
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
          balance: computeBalance(nextAccounts),
          budgets: nextBudgets,
          transactions: [nextTransaction, ...state.transactions]
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
