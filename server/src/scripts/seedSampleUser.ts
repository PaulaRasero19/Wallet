import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { CreditCard } from "../models/CreditCard";
import { DeviceToken } from "../models/DeviceToken";
import { FinancialProfile } from "../models/FinancialProfile";
import { Goal } from "../models/Goal";
import { Notification } from "../models/Notification";
import { PlannerEvent } from "../models/PlannerEvent";
import { RecurringPayment } from "../models/RecurringPayment";
import { RefreshToken } from "../models/RefreshToken";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { ensureSystemCategories } from "../services/categorySeedService";
import { logger } from "../utils/logger";

const targetEmail = (process.env.SAMPLE_USER_EMAIL || "usuario@gmail.com").trim().toLowerCase();
const targetPassword = (process.env.SAMPLE_USER_PASSWORD || "Usuario.123").trim();
const legacyEmail = "ejemplo@gmail.com";
const salary = 62000;
const startBalance = 28500;

type AccountKey = "bank" | "cash" | "credit" | "usd";

type MovementSeed = {
  account: AccountKey;
  categoryKey: string;
  type: "income" | "expense";
  title: string;
  merchant: string;
  amount: number;
  currency: "UYU" | "USD";
  date: Date;
  note?: string;
  isRecurring?: boolean;
  isAntExpense?: boolean;
  paymentMethod?: string;
  installment?: {
    current: number;
    total: number;
    amountPerInstallment: number;
    remainingAmount: number;
    nextDueDate: string;
  };
};

function clampDay(year: number, month: number, day: number) {
  return Math.min(day, new Date(year, month + 1, 0).getDate());
}

function makeDate(monthsAgo: number, day: number, hour = 12) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsAgo;
  return new Date(year, month, clampDay(year, month, day), hour, 0, 0, 0);
}

function monthKey(monthsAgo: number) {
  return makeDate(monthsAgo, 1).toISOString().slice(0, 7);
}

function weekday(date: Date) {
  return date.toLocaleDateString("es-UY", { weekday: "long" });
}

async function deleteFinancialData(userId: Types.ObjectId) {
  await Promise.all([
    Account.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    FinancialProfile.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    CreditCard.deleteMany({ userId }),
    PlannerEvent.deleteMany({ userId }),
    RecurringPayment.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    DeviceToken.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId })
  ]);
}

async function deleteUserCascade(email: string) {
  const user = await User.findOne({ email });
  if (!user) return false;
  const userId = user._id as Types.ObjectId;
  await deleteFinancialData(userId);
  await User.deleteOne({ _id: userId });
  return true;
}

async function findCategoryIds() {
  const categories = await Category.find({ isSystem: true, userId: null });
  const byKey = new Map(categories.map((category) => [category.translationKey, category._id as Types.ObjectId]));

  return (key: string) => {
    const id = byKey.get(key);
    if (!id) throw new Error(`Missing category ${key}.`);
    return id;
  };
}

function monthMovements(monthsAgo: number): MovementSeed[] {
  const currentMonth = monthsAgo === 0;
  const today = new Date().getDate();
  const add = (day: number, movement: Omit<MovementSeed, "date"> & { hour: number }) => {
    if (currentMonth && day > today) return null;
    const { hour, ...rest } = movement;
    return { ...rest, date: makeDate(monthsAgo, day, hour) };
  };

  const freelance = [0, 4200, 0, 6800, 0, 3500, 9200, 0, 5200, 0, 7400, 0][monthsAgo] || 0;
  const rent = 28500 + (monthsAgo > 6 ? -1200 : 0);
  const commonExpenses = 5200 + ((monthsAgo + 1) % 3) * 350;
  const supermarketA = 3650 + (monthsAgo % 4) * 220;
  const supermarketB = 4280 + (monthsAgo % 5) * 180;
  const delivery = [820, 690, 1040, 760, 590, 880, 720, 960, 640, 830, 710, 900][monthsAgo] || 720;
  const friends = [1850, 2400, 1450, 3200, 2100, 1680, 2850, 1950, 2600, 2200, 1750, 3100][monthsAgo] || 2100;
  const clothes = [0, 2890, 0, 4200, 0, 0, 3650, 0, 2480, 0, 0, 3900][monthsAgo] || 0;
  const aguinaldo = monthsAgo === 1 || monthsAgo === 7 ? Math.round(salary / 2) : 0;

  return [
    add(1, { account: "bank", categoryKey: "income.salary", type: "income", title: "Sueldo mensual", merchant: "Agencia de diseño", amount: salary, currency: "UYU", hour: 10, isRecurring: true, paymentMethod: "transferencia" }),
    aguinaldo ? add(15, { account: "bank", categoryKey: "income.salary", type: "income", title: "Aguinaldo", merchant: "Agencia de diseño", amount: aguinaldo, currency: "UYU", hour: 10, paymentMethod: "transferencia" }) : null,
    freelance ? add(8, { account: "bank", categoryKey: "income.freelance", type: "income", title: "Trabajo freelance", merchant: "Cliente independiente", amount: freelance, currency: "UYU", hour: 17, paymentMethod: "transferencia" }) : null,
    add(2, { account: "bank", categoryKey: "expense.savings", type: "expense", title: "Aporte fondo emergencia", merchant: "Caja de ahorro", amount: 6500, currency: "UYU", hour: 10, isRecurring: true, paymentMethod: "transferencia" }),
    add(5, { account: "bank", categoryKey: "expense.rent", type: "expense", title: "Apartamento Cordón", merchant: "Inmobiliaria Cordón", amount: rent, currency: "UYU", hour: 9, isRecurring: true, paymentMethod: "transferencia" }),
    add(7, { account: "bank", categoryKey: "expense.common_expenses", type: "expense", title: "Gastos comunes", merchant: "Administración edificio", amount: commonExpenses, currency: "UYU", hour: 11, isRecurring: true, paymentMethod: "transferencia" }),
    add(10, { account: "bank", categoryKey: "expense.mutualista", type: "expense", title: "Mutualista", merchant: "Médica Uruguaya", amount: 3180, currency: "UYU", hour: 8, isRecurring: true, paymentMethod: "debito" }),
    add(11, { account: "bank", categoryKey: "expense.ute", type: "expense", title: "UTE apartamento", merchant: "UTE", amount: 1720 + monthsAgo * 35, currency: "UYU", hour: 18, isRecurring: true, paymentMethod: "debito" }),
    add(12, { account: "bank", categoryKey: "expense.ose", type: "expense", title: "OSE apartamento", merchant: "OSE", amount: 690 + monthsAgo * 12, currency: "UYU", hour: 18, isRecurring: true, paymentMethod: "debito" }),
    add(14, { account: "bank", categoryKey: "expense.antel", type: "expense", title: "Antel fibra y móvil", merchant: "Antel", amount: 2450, currency: "UYU", hour: 19, isRecurring: true, paymentMethod: "debito" }),
    add(4, { account: "bank", categoryKey: "expense.supermarket", type: "expense", title: "Supermercado semanal", merchant: "Disco", amount: supermarketA, currency: "UYU", hour: 20, paymentMethod: "debito" }),
    add(18, { account: "bank", categoryKey: "expense.supermarket", type: "expense", title: "Supermercado semanal", merchant: "Tienda Inglesa", amount: supermarketB, currency: "UYU", hour: 20, paymentMethod: "debito" }),
    add(3, { account: "cash", categoryKey: "expense.stm", type: "expense", title: "Recarga STM", merchant: "STM", amount: 1450, currency: "UYU", hour: 8, isRecurring: true, paymentMethod: "efectivo" }),
    add(6, { account: "cash", categoryKey: "expense.food", type: "expense", title: "Café antes del trabajo", merchant: "Café Brasilero", amount: 210, currency: "UYU", hour: 9, isAntExpense: true, paymentMethod: "efectivo" }),
    add(13, { account: "cash", categoryKey: "expense.food", type: "expense", title: "Almuerzo oficina", merchant: "La Pasiva", amount: 520, currency: "UYU", hour: 13, paymentMethod: "debito" }),
    add(15, { account: "credit", categoryKey: "expense.delivery", type: "expense", title: "Delivery viernes", merchant: "PedidosYa", amount: delivery, currency: "UYU", hour: 22, isAntExpense: delivery <= 850, paymentMethod: "credito" }),
    add(16, { account: "credit", categoryKey: "expense.entertainment", type: "expense", title: "Salida con amigas", merchant: "Bar Rodó", amount: friends, currency: "UYU", hour: 23, paymentMethod: "credito", note: "Cena y tragos con amigas." }),
    add(17, { account: "cash", categoryKey: "expense.transport", type: "expense", title: "Uber vuelta a casa", merchant: "Uber", amount: 390 + monthsAgo * 8, currency: "UYU", hour: 1, isAntExpense: true, paymentMethod: "tarjeta" }),
    add(20, { account: "bank", categoryKey: "expense.health", type: "expense", title: "Farmacia", merchant: "Farmashop", amount: 940 + (monthsAgo % 3) * 180, currency: "UYU", hour: 18, paymentMethod: "debito" }),
    add(22, { account: "credit", categoryKey: "expense.subscriptions", type: "expense", title: "Streaming", merchant: "Netflix", amount: 520, currency: "UYU", hour: 8, isRecurring: true, paymentMethod: "credito" }),
    add(24, { account: "credit", categoryKey: "expense.entertainment", type: "expense", title: "Cine con amigos", merchant: "Movie", amount: 890, currency: "UYU", hour: 21, paymentMethod: "credito" }),
    clothes ? add(26, { account: "credit", categoryKey: "expense.shopping", type: "expense", title: "Ropa", merchant: monthsAgo % 2 ? "Indian" : "Zara", amount: clothes, currency: "UYU", hour: 17, paymentMethod: "credito" }) : null,
    add(27, { account: "bank", categoryKey: "expense.education", type: "expense", title: "Curso online", merchant: "Domestika", amount: 980, currency: "UYU", hour: 12, paymentMethod: "debito" })
  ].filter(Boolean) as MovementSeed[];
}

function installmentMovements(): MovementSeed[] {
  return [
    {
      account: "credit",
      categoryKey: "expense.shopping",
      type: "expense",
      title: "Sommier 10 cuotas",
      merchant: "Divino",
      amount: 1890,
      currency: "UYU",
      date: makeDate(0, 9, 15),
      paymentMethod: "credito",
      installment: { current: 6, total: 10, amountPerInstallment: 1890, remainingAmount: 7560, nextDueDate: makeDate(-1, 10).toISOString() }
    },
    {
      account: "credit",
      categoryKey: "expense.education",
      type: "expense",
      title: "Notebook 12 cuotas",
      merchant: "Mercado Libre",
      amount: 2450,
      currency: "UYU",
      date: makeDate(0, 10, 14),
      paymentMethod: "credito",
      installment: { current: 4, total: 12, amountPerInstallment: 2450, remainingAmount: 19600, nextDueDate: makeDate(-1, 10).toISOString() }
    }
  ];
}

function accountBalance(initial: number, movements: MovementSeed[], account: AccountKey) {
  return movements
    .filter((movement) => movement.account === account && movement.currency === "UYU")
    .reduce((balance, movement) => balance + (movement.type === "income" ? movement.amount : -movement.amount), initial);
}

function monthTotal(movements: MovementSeed[], type: "income" | "expense", monthsAgo: number) {
  const key = monthKey(monthsAgo);
  return movements.filter((movement) => movement.type === type && movement.date.toISOString().startsWith(key)).reduce((sum, movement) => sum + movement.amount, 0);
}

async function seed() {
  await connectDatabase();
  await ensureSystemCategories();

  const deletedLegacy = await deleteUserCascade(legacyEmail);
  const passwordHash = await bcrypt.hash(targetPassword, 12);
  let user = await User.findOne({ email: targetEmail });

  if (!user) {
    user = await User.create({
      fullName: "Lucía Fernández",
      email: targetEmail,
      passwordHash,
      emailVerified: true,
      isDemo: false,
      onboardingCompleted: true
    });
  } else {
    await User.updateOne(
      { _id: user._id },
      {
        emailVerified: true,
        fullName: "Lucía Fernández",
        isDemo: false,
        onboardingCompleted: true,
        passwordHash
      }
    );
    user = await User.findById(user._id);
  }

  if (!user) throw new Error("Could not create or update sample user.");
  const userId = user._id as Types.ObjectId;
  await deleteFinancialData(userId);

  const movements = Array.from({ length: 12 }, (_, index) => monthMovements(index)).flat();
  movements.push(...installmentMovements());
  const categoryId = await findCategoryIds();

  await FinancialProfile.create({
    userId,
    countryCode: "UY",
    language: "es",
    locale: "es-UY",
    primaryCurrency: "UYU",
    secondaryCurrencies: ["USD"],
    incomeFrequency: "monthly",
    payday: 1,
    monthlyIncome: salary,
    hasVariableIncome: false,
    initialBalance: startBalance,
    financialGoal: "ordenar gastos viviendo sola y armar fondo de emergencia",
    antExpenseThreshold: 550,
    notificationsEnabled: true,
    weeklySummaryEnabled: true
  });

  const [bank, cash, usd, credit] = await Account.create([
    {
      userId,
      name: "Cuenta sueldo",
      type: "bank",
      currency: "UYU",
      initialBalance: startBalance,
      currentBalance: accountBalance(startBalance, movements, "bank"),
      isActive: true
    },
    {
      userId,
      name: "Efectivo",
      type: "cash",
      currency: "UYU",
      initialBalance: 6200,
      currentBalance: accountBalance(6200, movements, "cash"),
      isActive: true
    },
    {
      userId,
      name: "Ahorro USD",
      type: "savings",
      currency: "USD",
      initialBalance: 740,
      currentBalance: 740,
      isActive: true
    },
    {
      userId,
      name: "Visa Itaú",
      type: "credit",
      currency: "UYU",
      initialBalance: 0,
      currentBalance: accountBalance(0, movements, "credit"),
      isActive: true
    }
  ]);

  const accountIds: Record<AccountKey, Types.ObjectId> = {
    bank: bank._id as Types.ObjectId,
    cash: cash._id as Types.ObjectId,
    credit: credit._id as Types.ObjectId,
    usd: usd._id as Types.ObjectId
  };

  await Transaction.insertMany(
    movements.map((movement) => ({
      userId,
      accountId: accountIds[movement.account],
      categoryId: categoryId(movement.categoryKey),
      type: movement.type,
      title: movement.title,
      merchant: movement.merchant,
      amount: movement.amount,
      currency: movement.currency,
      date: movement.date,
      note: movement.note || "",
      paymentMethod: movement.paymentMethod || "",
      weekday: weekday(movement.date),
      hour: movement.date.getHours(),
      isRecurring: Boolean(movement.isRecurring),
      isAntExpense: Boolean(movement.isAntExpense),
      installment: movement.installment || undefined
    }))
  );

  await Goal.create({
    userId,
    name: "Fondo de emergencia",
    target: 180000,
    saved: 78000,
    currency: "UYU",
    monthlyContribution: 6500,
    accent: "lime",
    history: Array.from({ length: 12 }, (_, index) => {
      const monthsAgo = 11 - index;
      return {
        month: monthKey(monthsAgo),
        saved: 6500 * (index + 1),
        target: 180000
      };
    })
  });

  const currentCardMovements = movements.filter((movement) => movement.account === "credit" && movement.date >= makeDate(0, 1, 0));
  const cardUsed = currentCardMovements.reduce((sum, movement) => sum + movement.amount, 0) + 12800;

  await CreditCard.create({
    userId,
    bank: "Banco Itaú Uruguay",
    name: "Visa Itaú",
    mask: "4482",
    currency: "UYU",
    limit: 60000,
    used: Math.round(cardUsed),
    closingDate: makeDate(0, 25).toISOString(),
    dueDate: makeDate(-1, 5).toISOString(),
    nextPaymentAmount: Math.round(cardUsed * 0.72),
    accent: "blue"
  });

  await RecurringPayment.insertMany([
    { userId, merchant: "Alquiler apartamento", category: "Housing", amount: 28500, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 5), status: "confirmed", kind: "fixed", confidence: 0.99 },
    { userId, merchant: "Gastos comunes", category: "Housing", amount: 5550, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 7), status: "confirmed", kind: "fixed", confidence: 0.97 },
    { userId, merchant: "Mutualista", category: "Health", amount: 3180, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 10), status: "confirmed", kind: "service", confidence: 0.96 },
    { userId, merchant: "UTE", category: "Other", amount: 1720, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 11), status: "pending", kind: "service", confidence: 0.95 },
    { userId, merchant: "OSE", category: "Other", amount: 690, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 12), status: "pending", kind: "service", confidence: 0.95 },
    { userId, merchant: "Antel", category: "Other", amount: 2450, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 14), status: "pending", kind: "service", confidence: 0.95 },
    { userId, merchant: "Netflix", category: "Entertainment", amount: 520, currency: "UYU", frequency: "monthly", nextChargeDate: makeDate(-1, 22), status: "pending", kind: "subscription", confidence: 0.91 }
  ]);

  await PlannerEvent.insertMany([
    { userId, title: "Cobro sueldo", date: makeDate(-1, 1, 10), time: "10:00", category: "Ingreso", done: false, accent: "lime" },
    { userId, title: "Pagar alquiler", date: makeDate(-1, 5, 9), time: "09:00", category: "Vencimiento", done: false, accent: "black" },
    { userId, title: "Vencimiento Visa Itaú", date: makeDate(-1, 5, 10), time: "10:00", category: "Tarjeta", done: false, accent: "orange" },
    { userId, title: "Pagar UTE", date: makeDate(-1, 11, 18), time: "18:00", category: "Servicio", done: false, accent: "blue" },
    { userId, title: "Pagar Antel", date: makeDate(-1, 14, 18), time: "18:00", category: "Servicio", done: false, accent: "blue" },
    { userId, title: "Aporte a fondo de emergencia", date: makeDate(-1, 2, 10), time: "10:30", category: "Meta", done: false, accent: "lime" }
  ]);

  await Notification.insertMany([
    {
      userId,
      type: "weekly_summary",
      title: "Resumen semanal",
      message: `Ingresos del mes: $U ${monthTotal(movements, "income", 0).toLocaleString("es-UY")} · gastos: $U ${monthTotal(movements, "expense", 0).toLocaleString("es-UY")}`,
      status: "pending",
      priority: "normal",
      scheduledFor: makeDate(0, Math.min(new Date().getDate() + 1, 28), 9),
      relatedEntityType: "analysis",
      relatedEntityId: null,
      actionType: "open_analysis",
      metadata: {},
      dedupeKey: `weekly_summary:${userId}:${monthKey(0)}`
    }
  ]);

  logger.info("Presentation user seeded.", {
    deletedLegacy,
    email: targetEmail,
    movements: movements.length,
    months: 12,
    password: targetPassword,
    userId: userId.toString()
  });

  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("Presentation sample seed failed.", { error: error instanceof Error ? error.message : "Unknown error" });
  await disconnectDatabase();
  process.exit(1);
});
