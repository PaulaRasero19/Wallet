import {
  Account,
  AiMessage,
  Budget,
  CreditCard,
  ExchangeRates,
  Goal,
  PlannerEvent,
  RecurringPayment,
  Transaction,
  User
} from "../types/finflow";

export const mockUser: User = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  nextIncomeDate: "2026-07-31"
};

export const mockExchangeRates: ExchangeRates = {
  UYU: 1,
  USD: 41,
  EUR: 45
};

export const mockAccounts: Account[] = [
  { id: "itau-uyu", name: "Cuenta sueldo", mask: "4242", balance: 45600, currency: "UYU", accent: "blue" },
  { id: "savings-usd", name: "Ahorro USD", mask: "8888", balance: 820, currency: "USD", accent: "lime" },
  { id: "visa-uyu", name: "Visa credito", mask: "7721", balance: -12840, currency: "UYU", accent: "orange" }
];

export const mockTransactions: Transaction[] = [
  { id: "t1", merchant: "PedidosYa", category: "Food", date: "Jul 20", time: "9:18 PM", amount: -560, currency: "UYU", type: "expense", accent: "orange", accountId: "itau-uyu", weekday: "Monday", hour: 21, isAntExpense: true },
  { id: "t2", merchant: "STM", category: "Transport", date: "Jul 20", time: "8:10 AM", amount: -52, currency: "UYU", type: "expense", accent: "black", accountId: "itau-uyu", weekday: "Monday", hour: 8, isAntExpense: true },
  { id: "t3", merchant: "Salary", category: "Salary", date: "Jul 1", time: "8:00 AM", amount: 42000, currency: "UYU", type: "income", accent: "lime", accountId: "itau-uyu", weekday: "Wednesday", hour: 8 },
  { id: "t4", merchant: "Alquiler", category: "Housing", date: "Jul 3", time: "9:00 AM", amount: -18500, currency: "UYU", type: "expense", accent: "blue", accountId: "itau-uyu", weekday: "Friday", hour: 9 },
  { id: "t5", merchant: "Abitab", category: "Other", date: "Jul 7", time: "2:15 PM", amount: -740, currency: "UYU", type: "expense", accent: "lavender", accountId: "itau-uyu", weekday: "Tuesday", hour: 14 },
  { id: "t6", merchant: "Supermercado Disco", category: "Food", date: "Jul 9", time: "7:47 PM", amount: -3280, currency: "UYU", type: "expense", accent: "black", accountId: "itau-uyu", weekday: "Thursday", hour: 19 },
  { id: "t7", merchant: "Freelance", category: "Freelance", date: "Jul 12", time: "4:33 PM", amount: 12500, currency: "UYU", type: "income", accent: "lime", accountId: "itau-uyu", weekday: "Sunday", hour: 16 },
  { id: "t8", merchant: "Merienda", category: "Food", date: "Jul 13", time: "5:50 PM", amount: -450, currency: "UYU", type: "expense", accent: "orange", accountId: "itau-uyu", weekday: "Monday", hour: 17, isAntExpense: true },
  { id: "t9", merchant: "Antel", category: "Other", date: "Jul 15", time: "11:20 AM", amount: -1450, currency: "UYU", type: "expense", accent: "blue", accountId: "itau-uyu", weekday: "Wednesday", hour: 11 },
  { id: "t10", merchant: "Notebook", category: "Shopping", date: "Jul 16", time: "6:40 PM", amount: -2450, currency: "UYU", type: "expense", accent: "lavender", accountId: "visa-uyu", weekday: "Thursday", hour: 18, installment: { current: 1, total: 12, amountPerInstallment: 2450, remainingAmount: 26950, nextDueDate: "2026-08-10" } },
  { id: "t11", merchant: "Redpagos", category: "Other", date: "Jul 18", time: "12:15 PM", amount: -320, currency: "UYU", type: "expense", accent: "orange", accountId: "itau-uyu", weekday: "Saturday", hour: 12, isAntExpense: true },
  { id: "t12", merchant: "Cafe Martinez", category: "Food", date: "Jul 19", time: "6:05 PM", amount: -390, currency: "UYU", type: "expense", accent: "orange", accountId: "itau-uyu", weekday: "Sunday", hour: 18, isAntExpense: true }
];

export const mockBudgets: Budget[] = [
  { id: "b1", name: "Housing", spent: 18500, limit: 24500, currency: "UYU", accent: "blue" },
  { id: "b2", name: "Food", spent: 4680, limit: 9800, currency: "UYU", accent: "orange" },
  { id: "b3", name: "Transport", spent: 1300, limit: 3600, currency: "UYU", accent: "black" },
  { id: "b4", name: "Shopping", spent: 2450, limit: 6500, currency: "UYU", accent: "lime" },
  { id: "b5", name: "Entertainment", spent: 2100, limit: 4200, currency: "UYU", accent: "lavender" },
  { id: "b6", name: "Other", spent: 2510, limit: 5200, currency: "UYU", accent: "grayLight" }
];

export const mockGoals: Goal[] = [
  { id: "g1", name: "Fondo de emergencia", saved: 28000, target: 90000, currency: "UYU", monthlyContribution: 6000, accent: "black" },
  { id: "g2", name: "Viaje", saved: 42000, target: 120000, currency: "UYU", monthlyContribution: 5000, accent: "blue" },
  { id: "g3", name: "Notebook", saved: 14000, target: 52000, currency: "UYU", monthlyContribution: 2500, accent: "lavender" }
];

export const mockRecurringPayments: RecurringPayment[] = [
  { id: "r1", merchant: "UTE", category: "Other", amount: 2600, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-07-24", status: "confirmed", kind: "service", confidence: 0.96 },
  { id: "r2", merchant: "OSE", category: "Other", amount: 880, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-07-25", status: "confirmed", kind: "service", confidence: 0.94 },
  { id: "r3", merchant: "Antel", category: "Other", amount: 1450, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-08-15", status: "pending", kind: "service", confidence: 0.88 },
  { id: "r4", merchant: "Netflix", category: "Entertainment", amount: 590, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-07-28", status: "pending", kind: "subscription", confidence: 0.82, priceChange: 80 },
  { id: "r5", merchant: "Spotify", category: "Entertainment", amount: 299, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-07-29", status: "pending", kind: "subscription", confidence: 0.8, duplicateGroup: "music" },
  { id: "r6", merchant: "YouTube Music", category: "Entertainment", amount: 349, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-07-30", status: "pending", kind: "subscription", confidence: 0.74, duplicateGroup: "music" },
  { id: "r7", merchant: "Mutualista", category: "Other", amount: 2100, currency: "UYU", frequency: "monthly", nextChargeDate: "2026-07-27", status: "confirmed", kind: "fixed", confidence: 0.9 }
];

export const mockCreditCards: CreditCard[] = [
  { id: "visa-uyu", name: "Visa credito", mask: "7721", currency: "UYU", limit: 65000, used: 31850, closingDate: "2026-07-25", dueDate: "2026-08-10", accent: "orange" }
];

export const mockEvents: PlannerEvent[] = [
  { id: "e1", title: "Morning Routine", time: "8 AM", category: "Habit", done: false, accent: "black" },
  { id: "e2", title: "Budget Review", time: "10 AM", category: "Finance", done: false, accent: "black" },
  { id: "e3", title: "Lunch with Sarah", time: "12 PM", category: "Personal", done: false, accent: "orange" },
  { id: "e4", title: "Project Meeting", time: "2 PM", category: "Work", done: false, accent: "black" },
  { id: "e5", title: "Gym", time: "6 PM", category: "Health", done: false, accent: "blue" },
  { id: "e6", title: "Read & Reflect", time: "8 PM", category: "Habit", done: false, accent: "black" }
];

export const mockMessages: AiMessage[] = [
  {
    id: "a1",
    role: "assistant",
    text: "You spent 14% more on food this month compared to last month.",
    progress: 58
  },
  {
    id: "a2",
    role: "assistant",
    text: "Consider setting a weekly food budget of $120 to stay on track."
  },
  {
    id: "u1",
    role: "user",
    text: "Show me ways to save more"
  }
];
