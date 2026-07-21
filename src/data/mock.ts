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
  name: "",
  email: "",
  nextIncomeDate: ""
};

export const mockExchangeRates: ExchangeRates = {
  UYU: 1,
  USD: 1,
  EUR: 1
};

export const mockAccounts: Account[] = [];
export const mockTransactions: Transaction[] = [];
export const mockBudgets: Budget[] = [];
export const mockGoals: Goal[] = [];
export const mockRecurringPayments: RecurringPayment[] = [];
export const mockCreditCards: CreditCard[] = [];
export const mockEvents: PlannerEvent[] = [];
export const mockMessages: AiMessage[] = [];
