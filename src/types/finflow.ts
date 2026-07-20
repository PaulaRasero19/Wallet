import { AccentColor } from "../theme";

export type TransactionType = "income" | "expense" | "transfer";
export type BudgetCategory = "Housing" | "Food" | "Transport" | "Shopping" | "Entertainment" | "Other";

export type User = {
  name: string;
  email: string;
};

export type Account = {
  id: string;
  name: string;
  mask: string;
  balance: number;
  accent: AccentColor;
};

export type Transaction = {
  id: string;
  merchant: string;
  category: BudgetCategory | "Salary" | "Freelance";
  date: string;
  time: string;
  amount: number;
  type: TransactionType;
  accent: AccentColor;
};

export type Budget = {
  id: string;
  name: BudgetCategory;
  spent: number;
  limit: number;
  accent: AccentColor;
};

export type Goal = {
  id: string;
  name: string;
  saved: number;
  target: number;
  accent: AccentColor;
};

export type PlannerEvent = {
  id: string;
  title: string;
  time: string;
  category: string;
  done: boolean;
  accent: AccentColor;
};

export type Task = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  reminder: boolean;
  note: string;
  accent: AccentColor;
};

export type AiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  progress?: number;
};
