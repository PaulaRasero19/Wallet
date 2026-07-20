import { Account, AiMessage, Budget, Goal, PlannerEvent, Transaction, User } from "../types/finflow";

export const mockUser: User = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com"
};

export const mockAccounts: Account[] = [
  { id: "checking", name: "Checking", mask: "4242", balance: 4350.2, accent: "blue" },
  { id: "savings", name: "Savings", mask: "8888", balance: 4292.55, accent: "lime" },
  { id: "credit", name: "Credit Card", mask: "7721", balance: -1862.12, accent: "orange" }
];

export const mockTransactions: Transaction[] = [
  { id: "t1", merchant: "Starbucks", category: "Food", date: "May 24", time: "8:41 AM", amount: -5.75, type: "expense", accent: "orange" },
  { id: "t2", merchant: "Uber", category: "Transport", date: "May 20", time: "6:21 PM", amount: -18.4, type: "expense", accent: "black" },
  { id: "t3", merchant: "Salary", category: "Salary", date: "May 20", time: "8:00 AM", amount: 2800, type: "income", accent: "lime" },
  { id: "t4", merchant: "Rent", category: "Housing", date: "May 19", time: "8:00 AM", amount: -1200, type: "expense", accent: "blue" },
  { id: "t5", merchant: "Amazon", category: "Shopping", date: "May 18", time: "2:15 PM", amount: -42.3, type: "expense", accent: "orange" },
  { id: "t6", merchant: "Groceries", category: "Food", date: "May 18", time: "11:47 AM", amount: -76.12, type: "expense", accent: "black" },
  { id: "t7", merchant: "Freelance", category: "Freelance", date: "May 17", time: "4:33 PM", amount: 350, type: "income", accent: "lime" },
  { id: "t8", merchant: "Gym", category: "Other", date: "May 16", time: "7:50 AM", amount: -29.99, type: "expense", accent: "lavender" }
];

export const mockBudgets: Budget[] = [
  { id: "b1", name: "Housing", spent: 1200, limit: 1200, accent: "blue" },
  { id: "b2", name: "Food", spent: 420.6, limit: 620, accent: "orange" },
  { id: "b3", name: "Transport", spent: 280.4, limit: 420, accent: "black" },
  { id: "b4", name: "Shopping", spent: 180.3, limit: 360, accent: "lime" },
  { id: "b5", name: "Entertainment", spent: 104.1, limit: 250, accent: "lavender" },
  { id: "b6", name: "Other", spent: 0, limit: 350, accent: "grayLight" }
];

export const mockGoals: Goal[] = [
  { id: "g1", name: "Emergency Fund", saved: 2400, target: 5000, accent: "black" },
  { id: "g2", name: "Travel Japan", saved: 1250, target: 2500, accent: "blue" },
  { id: "g3", name: "New Laptop", saved: 850, target: 1600, accent: "lavender" }
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
