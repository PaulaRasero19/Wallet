import type { Account } from "../models/Account";
import type { Category } from "../models/Category";
import type { FinancialProfile } from "../models/FinancialProfile";
import type { Transaction } from "../models/Transaction";
import type { User } from "../models/User";

function idOf(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? value.toString() : String(value || "");
}

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : null;
}

export function userDTO(user: InstanceType<typeof User>) {
  return {
    id: idOf(user._id),
    fullName: user.fullName,
    full_name: user.fullName,
    email: user.email,
    emailVerified: user.emailVerified,
    email_verified: user.emailVerified,
    isDemo: user.isDemo,
    is_demo: user.isDemo,
    onboardingCompleted: user.onboardingCompleted,
    onboarding_completed: user.onboardingCompleted,
    createdAt: iso(user.createdAt),
    created_at: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
    updated_at: iso(user.updatedAt)
  };
}

export function profileDTO(profile: InstanceType<typeof FinancialProfile> | null, user?: InstanceType<typeof User> | null) {
  if (!profile) {
    return null;
  }

  return {
    id: idOf(profile._id),
    userId: idOf(profile.userId),
    user_id: idOf(profile.userId),
    fullName: user?.fullName ?? null,
    full_name: user?.fullName ?? null,
    countryName: profile.countryName,
    country_name: profile.countryName,
    countryCode: profile.countryCode,
    country_code: profile.countryCode,
    language: profile.language,
    locale: profile.locale,
    currencyName: profile.currencyName,
    currency_name: profile.currencyName,
    currencySymbol: profile.currencySymbol,
    currency_symbol: profile.currencySymbol,
    currencyCode: profile.primaryCurrency,
    currency_code: profile.primaryCurrency,
    primaryCurrency: profile.primaryCurrency,
    primary_currency: profile.primaryCurrency,
    secondaryCurrencies: profile.secondaryCurrencies,
    secondary_currencies: profile.secondaryCurrencies,
    profileSetupStep: profile.profileSetupStep,
    profile_setup_step: profile.profileSetupStep,
    incomeFrequency: profile.incomeFrequency,
    income_frequency: profile.incomeFrequency,
    payday: profile.payday,
    paydayDay: profile.payday,
    payday_day: profile.payday,
    secondPayday: profile.secondPayday,
    second_payday: profile.secondPayday,
    paydayWeekday: profile.paydayWeekday,
    payday_weekday: profile.paydayWeekday,
    monthlyIncome: profile.monthlyIncome,
    monthly_income: profile.monthlyIncome,
    hasVariableIncome: profile.hasVariableIncome,
    has_variable_income: profile.hasVariableIncome,
    initialBalance: profile.initialBalance,
    initial_balance: profile.initialBalance,
    financialGoal: profile.financialGoal,
    financial_goal: profile.financialGoal,
    primaryGoal: profile.primaryGoal,
    primary_goal: profile.primaryGoal,
    antExpenseThreshold: profile.antExpenseThreshold,
    ant_expense_threshold: profile.antExpenseThreshold,
    notificationsEnabled: profile.notificationsEnabled,
    notifications_enabled: profile.notificationsEnabled,
    weeklySummaryEnabled: profile.weeklySummaryEnabled,
    weekly_summary_enabled: profile.weeklySummaryEnabled,
    onboardingCompleted: user?.onboardingCompleted ?? false,
    onboarding_completed: user?.onboardingCompleted ?? false,
    profileSetupCompleted: user?.onboardingCompleted ?? false,
    profile_setup_completed: user?.onboardingCompleted ?? false,
    isDemo: user?.isDemo ?? false,
    is_demo: user?.isDemo ?? false,
    createdAt: iso(profile.createdAt),
    created_at: iso(profile.createdAt),
    updatedAt: iso(profile.updatedAt),
    updated_at: iso(profile.updatedAt)
  };
}

export function accountDTO(account: InstanceType<typeof Account>) {
  return {
    id: idOf(account._id),
    userId: idOf(account.userId),
    user_id: idOf(account.userId),
    name: account.name,
    type: account.type,
    currency: account.currency,
    initialBalance: account.initialBalance,
    initial_balance: account.initialBalance,
    currentBalance: account.currentBalance,
    current_balance: account.currentBalance,
    balance: account.currentBalance,
    isActive: account.isActive,
    is_active: account.isActive,
    createdAt: iso(account.createdAt),
    created_at: iso(account.createdAt),
    updatedAt: iso(account.updatedAt),
    updated_at: iso(account.updatedAt)
  };
}

export function categoryDTO(category: InstanceType<typeof Category>) {
  return {
    id: idOf(category._id),
    userId: category.userId ? idOf(category.userId) : null,
    user_id: category.userId ? idOf(category.userId) : null,
    translationKey: category.translationKey,
    translation_key: category.translationKey,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    isSystem: category.isSystem,
    is_system: category.isSystem,
    isActive: category.isActive,
    is_active: category.isActive
  };
}

export function transactionDTO(transaction: InstanceType<typeof Transaction>) {
  return {
    id: idOf(transaction._id),
    userId: idOf(transaction.userId),
    user_id: idOf(transaction.userId),
    accountId: idOf(transaction.accountId),
    account_id: idOf(transaction.accountId),
    toAccountId: idOf(transaction.toAccountId),
    to_account_id: idOf(transaction.toAccountId),
    transferGroupId: transaction.transferGroupId,
    transfer_group_id: transaction.transferGroupId,
    categoryId: idOf(transaction.categoryId),
    category_id: idOf(transaction.categoryId),
    type: transaction.type,
    title: transaction.title,
    merchant: transaction.merchant || transaction.title,
    amount: transaction.type === "expense" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
    rawAmount: transaction.amount,
    raw_amount: transaction.amount,
    currency: transaction.currency,
    date: iso(transaction.date),
    time: transaction.date instanceof Date ? transaction.date.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }) : "",
    note: transaction.note,
    paymentMethod: transaction.paymentMethod,
    payment_method: transaction.paymentMethod,
    weekday: transaction.weekday,
    hour: transaction.hour,
    isRecurring: transaction.isRecurring,
    is_recurring: transaction.isRecurring,
    isAntExpense: transaction.isAntExpense,
    is_ant_expense: transaction.isAntExpense,
    installment:
      transaction.installment?.current && transaction.installment?.total
        ? {
            current: transaction.installment.current,
            total: transaction.installment.total,
            amountPerInstallment: transaction.installment.amountPerInstallment,
            amount_per_installment: transaction.installment.amountPerInstallment,
            remainingAmount: transaction.installment.remainingAmount,
            remaining_amount: transaction.installment.remainingAmount,
            nextDueDate: transaction.installment.nextDueDate,
            next_due_date: transaction.installment.nextDueDate
          }
        : null,
    createdAt: iso(transaction.createdAt),
    created_at: iso(transaction.createdAt),
    updatedAt: iso(transaction.updatedAt),
    updated_at: iso(transaction.updatedAt)
  };
}
