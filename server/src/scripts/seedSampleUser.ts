import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { CreditCard } from "../models/CreditCard";
import { DeviceToken } from "../models/DeviceToken";
import { FinancialProfile } from "../models/FinancialProfile";
import { Goal } from "../models/Goal";
import { InstallmentPurchase } from "../models/InstallmentPurchase";
import { Notification } from "../models/Notification";
import { PasswordResetToken } from "../models/PasswordResetToken";
import { PlannerEvent } from "../models/PlannerEvent";
import { RecurringPayment } from "../models/RecurringPayment";
import { RefreshToken } from "../models/RefreshToken";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { ensureSystemCategories } from "../services/categorySeedService";
import { logger } from "../utils/logger";

const configuredEmail = (process.env.SAMPLE_USER_EMAIL || "usuario@gmail.com").trim().toLowerCase();
const targetEmails = [...new Set([configuredEmail, "usuario@gmail.com", "ejemplo@gmail.com"])];
const targetPassword = (process.env.SAMPLE_USER_PASSWORD || "Usuario.123").trim();
const salary = 58_000;

const julyTransactions = [
  { demoId: "demo-salary-2026-07", categoryKey: "income.salary", type: "income", status: "received", title: "Sueldo", merchant: "Empleador", amount: 58_000, day: 1 },
  { demoId: "demo-rent-2026-07", categoryKey: "expense.rent", type: "expense", status: "paid", title: "Alquiler", merchant: "Inmobiliaria", amount: 18_000, day: 5 },
  { demoId: "demo-supermarket-2026-07", categoryKey: "expense.supermarket", type: "expense", status: "paid", title: "Supermercado", merchant: "Supermercado", amount: 8_500, day: 8 },
  { demoId: "demo-transport-2026-07", categoryKey: "expense.transport", type: "expense", status: "paid", title: "Transporte", merchant: "STM y traslados", amount: 3_200, day: 10 },
  { demoId: "demo-services-2026-07", categoryKey: "expense.ute", type: "expense", status: "paid", title: "Servicios", merchant: "Servicios del hogar", amount: 4_300, day: 12 },
  { demoId: "demo-entertainment-2026-07", categoryKey: "expense.entertainment", type: "expense", status: "paid", title: "Salidas", merchant: "Salidas", amount: 2_500, day: 16 },
  { demoId: "demo-ant-expenses-2026-07", categoryKey: "expense.food", type: "expense", status: "paid", title: "Gastos hormiga", merchant: "Compras pequeñas", amount: 1_420, day: 18, isAntExpense: true },
  { demoId: "demo-installment-2026-07", categoryKey: "expense.shopping", type: "expense", status: "paid", title: "Compra en cuotas · Cuota 1 de 12", merchant: "Compra en cuotas", amount: 2_000, day: 20, installment: { current: 1, total: 12, amountPerInstallment: 2_000, remainingAmount: 22_000, nextDueDate: "2026-08-20" } }
] as const;

function julyDate(day: number, hour = 12) {
  return new Date(2026, 6, day, hour, 0, 0, 0);
}

async function clearFinancialData(userId: Types.ObjectId) {
  await Promise.all([
    Account.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    FinancialProfile.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    CreditCard.deleteMany({ userId }),
    InstallmentPurchase.deleteMany({ userId }),
    PlannerEvent.deleteMany({ userId }),
    RecurringPayment.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    DeviceToken.deleteMany({ userId }),
    PasswordResetToken.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId })
  ]);
}

async function categoryIds() {
  const categories = await Category.find({ isSystem: true, userId: null });
  return new Map(categories.map((category) => [category.translationKey, category._id as Types.ObjectId]));
}

async function seed() {
  await connectDatabase();
  await ensureSystemCategories();

  for (const targetEmail of targetEmails) {
  const passwordHash = await bcrypt.hash(targetPassword, 12);
  const user = await User.findOneAndUpdate(
    { email: targetEmail },
    { $set: { fullName: "Lucía Fernández", passwordHash, emailVerified: true, isDemo: true, onboardingCompleted: true } },
    { returnDocument: "after", upsert: true }
  );
  const userId = user._id as Types.ObjectId;

  // Reset only the presentation user. Re-running this seed always produces the same state.
  await clearFinancialData(userId);

  await FinancialProfile.create({
    userId,
    countryName: "Uruguay",
    countryCode: "UY",
    currencyName: "Peso uruguayo",
    currencySymbol: "$U",
    language: "es",
    locale: "es-UY",
    primaryCurrency: "UYU",
    secondaryCurrencies: [],
    incomeFrequency: "monthly",
    payday: 1,
    monthlyIncome: salary,
    hasVariableIncome: false,
    initialBalance: 0,
    financialGoal: "Mantener un presupuesto mensual ordenado",
    antExpenseThreshold: 1_500,
    notificationsEnabled: true,
    weeklySummaryEnabled: true
  });

  const account = await Account.create({
    userId,
    name: "Cuenta principal",
    type: "bank",
    currency: "UYU",
    initialBalance: 0,
    currentBalance: 18_080,
    isActive: true
  });

  const ids = await categoryIds();
  const rows = julyTransactions.map((movement) => {
    const categoryId = ids.get(movement.categoryKey);
    if (!categoryId) throw new Error(`Missing category ${movement.categoryKey}.`);
    const date = julyDate(movement.day);
    return {
      userId,
      accountId: account._id,
      categoryId,
      demoId: movement.demoId,
      type: movement.type,
      status: movement.status,
      title: movement.title,
      merchant: movement.merchant,
      amount: movement.amount,
      currency: "UYU",
      date,
      note: "",
      paymentMethod: "débito",
      weekday: date.toLocaleDateString("es-UY", { weekday: "long" }),
      hour: date.getHours(),
      isRecurring: movement.type === "income" || movement.demoId === "demo-rent-2026-07",
      isAntExpense: "isAntExpense" in movement && movement.isAntExpense,
      installment: "installment" in movement ? movement.installment : undefined
    };
  });
  await Transaction.insertMany(rows);

  const paidInstallmentTransaction = await Transaction.findOne({ userId, demoId: "demo-installment-2026-07" });
  const installments = Array.from({ length: 12 }, (_, index) => ({
    number: index + 1,
    amount: 2_000,
    dueDate: new Date(2026, 6 + index, 20, 12),
    status: index === 0 ? "paid" : "pending",
    paidAt: index === 0 ? julyDate(20) : null,
    transactionId: index === 0 ? paidInstallmentTransaction?._id : null
  }));
  await InstallmentPurchase.create({
    userId,
    accountId: account._id,
    name: "Compra en cuotas",
    category: "compras",
    totalAmount: 24_000,
    installmentAmount: 2_000,
    totalInstallments: 12,
    paidInstallments: 1,
    currency: "UYU",
    firstDueDate: julyDate(20),
    reminderDaysBefore: 3,
    status: "active",
    installments
  });

  await RecurringPayment.create({
    userId,
    accountId: account._id,
    merchant: "Internet",
    category: "servicios",
    amount: 1_800,
    currency: "UYU",
    frequency: "monthly",
    nextChargeDate: julyDate(28),
    status: "pending",
    kind: "service",
    confidence: 1,
    active: true
  });

  await Goal.create({
    userId,
    name: "Fondo de emergencia",
    target: 120_000,
    saved: 0,
    currency: "UYU",
    monthlyContribution: 5_000,
    accent: "lime",
    history: []
  });

  const income = rows.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0);
  const expenses = rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0);
  logger.info("Presentation user seeded idempotently.", { email: targetEmail, userId: userId.toString(), income, expenses, balance: income - expenses });
  }
  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("Presentation sample seed failed.", { error: error instanceof Error ? error.message : "Unknown error" });
  await disconnectDatabase();
  process.exit(1);
});
