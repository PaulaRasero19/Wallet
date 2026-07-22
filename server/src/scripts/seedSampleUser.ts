import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { CreditCard } from "../models/CreditCard";
import { FinancialProfile } from "../models/FinancialProfile";
import { Goal } from "../models/Goal";
import { PlannerEvent } from "../models/PlannerEvent";
import { RecurringPayment } from "../models/RecurringPayment";
import { RefreshToken } from "../models/RefreshToken";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { ensureSystemCategories } from "../services/categorySeedService";
import { logger } from "../utils/logger";

type AccountKey = "bank" | "cash" | "usd" | "credit";

type MovementSeed = {
  account: AccountKey;
  categoryKey: string;
  type: "income" | "expense";
  title: string;
  merchant: string;
  amount: number;
  currency: "UYU" | "USD";
  day: number;
  hour: number;
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

function requireSampleEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required in server/.env to seed the presentation account.`);
  }
  return value;
}

function monthDate(monthsAgo: number, day: number, hour = 12) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, hour, 0, 0, 0);
  return date;
}

function monthKey(monthsAgo: number) {
  return monthDate(monthsAgo, 1).toISOString().slice(0, 7);
}

function weekday(date: Date) {
  return date.toLocaleDateString("es-UY", { weekday: "long" });
}

async function findCategoryIds() {
  const categories = await Category.find({ isSystem: true, userId: null });
  const byKey = new Map(categories.map((category) => [category.translationKey, category._id]));

  return (key: string) => {
    const id = byKey.get(key);
    if (!id) throw new Error(`Missing category ${key}.`);
    return id;
  };
}

function monthlyMovements(monthsAgo: number): MovementSeed[] {
  const freelance = [12000, 8500, 0, 15600, 9800, 13200][monthsAgo] || 7000;
  const deliveryBase = [820, 650, 940, 760, 1040, 590][monthsAgo] || 650;
  const cafeBase = [180, 210, 190, 230, 205, 175][monthsAgo] || 190;

  return [
    { account: "bank", categoryKey: "income.salary", type: "income", title: "Sueldo mensual", merchant: "Estudio Bruma", amount: 92500, currency: "UYU", day: 1, hour: 10, isRecurring: true, paymentMethod: "transferencia" },
    { account: "bank", categoryKey: "income.freelance", type: "income", title: "Proyecto freelance", merchant: "Cliente independiente", amount: freelance, currency: "UYU", day: 9, hour: 16, paymentMethod: "transferencia" },
    { account: "bank", categoryKey: "expense.rent", type: "expense", title: "Alquiler", merchant: "Inmobiliaria Sur", amount: 32500, currency: "UYU", day: 5, hour: 9, isRecurring: true, paymentMethod: "debito automatico" },
    { account: "bank", categoryKey: "expense.common_expenses", type: "expense", title: "Gastos comunes", merchant: "Administracion Edificio", amount: 7200, currency: "UYU", day: 7, hour: 11, isRecurring: true, paymentMethod: "transferencia" },
    { account: "bank", categoryKey: "expense.ute", type: "expense", title: "UTE", merchant: "UTE", amount: 2380 + monthsAgo * 85, currency: "UYU", day: 12, hour: 18, isRecurring: true, paymentMethod: "debito" },
    { account: "bank", categoryKey: "expense.ose", type: "expense", title: "OSE", merchant: "OSE", amount: 980 + monthsAgo * 20, currency: "UYU", day: 13, hour: 18, isRecurring: true, paymentMethod: "debito" },
    { account: "bank", categoryKey: "expense.antel", type: "expense", title: "Antel fibra y movil", merchant: "Antel", amount: 2860, currency: "UYU", day: 15, hour: 19, isRecurring: true, paymentMethod: "debito" },
    { account: "bank", categoryKey: "expense.supermarket", type: "expense", title: "Supermercado semanal", merchant: "Disco", amount: 6420, currency: "UYU", day: 4, hour: 20, paymentMethod: "debito" },
    { account: "bank", categoryKey: "expense.supermarket", type: "expense", title: "Supermercado semanal", merchant: "Tienda Inglesa", amount: 5850, currency: "UYU", day: 18, hour: 20, paymentMethod: "debito" },
    { account: "cash", categoryKey: "expense.stm", type: "expense", title: "Recarga STM", merchant: "STM", amount: 1560, currency: "UYU", day: 3, hour: 8, isRecurring: true, paymentMethod: "efectivo" },
    { account: "cash", categoryKey: "expense.transport", type: "expense", title: "Uber", merchant: "Uber", amount: 460, currency: "UYU", day: 11, hour: 23, isAntExpense: true, paymentMethod: "tarjeta" },
    { account: "cash", categoryKey: "expense.food", type: "expense", title: "Cafe antes de clase", merchant: "Cafeteria Central", amount: cafeBase, currency: "UYU", day: 6, hour: 9, isAntExpense: true, paymentMethod: "efectivo" },
    { account: "cash", categoryKey: "expense.food", type: "expense", title: "Snack facultad", merchant: "Kiosco Facultad", amount: 145, currency: "UYU", day: 17, hour: 17, isAntExpense: true, paymentMethod: "efectivo" },
    { account: "credit", categoryKey: "expense.delivery", type: "expense", title: "Delivery viernes", merchant: "PedidosYa", amount: deliveryBase, currency: "UYU", day: 21, hour: 22, isAntExpense: deliveryBase <= 900, paymentMethod: "credito" },
    { account: "credit", categoryKey: "expense.subscriptions", type: "expense", title: "Streaming", merchant: "Netflix", amount: 520, currency: "UYU", day: 22, hour: 8, isRecurring: true, isAntExpense: false, paymentMethod: "credito" },
    { account: "credit", categoryKey: "expense.entertainment", type: "expense", title: "Cine", merchant: "Movie", amount: 890, currency: "UYU", day: 24, hour: 21, paymentMethod: "credito" },
    { account: "bank", categoryKey: "expense.health", type: "expense", title: "Farmacia", merchant: "Farmashop", amount: 1260, currency: "UYU", day: 20, hour: 18, paymentMethod: "debito" },
    { account: "bank", categoryKey: "expense.education", type: "expense", title: "Curso online", merchant: "Domestika", amount: 1680, currency: "UYU", day: 26, hour: 12, paymentMethod: "debito" },
    { account: "credit", categoryKey: "expense.shopping", type: "expense", title: "Ropa", merchant: "Indian", amount: 3890, currency: "UYU", day: 27, hour: 17, paymentMethod: "credito" },
    { account: "bank", categoryKey: "expense.savings", type: "expense", title: "Aporte meta ahorro", merchant: "Caja de ahorro", amount: 10500, currency: "UYU", day: 2, hour: 10, isRecurring: true, paymentMethod: "transferencia" }
  ];
}

function installmentMovements(): MovementSeed[] {
  return [
    {
      account: "credit",
      categoryKey: "expense.education",
      type: "expense",
      title: "Notebook 12 cuotas",
      merchant: "Tecnologia Montevideo",
      amount: 6250,
      currency: "UYU",
      day: 8,
      hour: 15,
      paymentMethod: "credito",
      installment: { current: 5, total: 12, amountPerInstallment: 6250, remainingAmount: 43750, nextDueDate: monthDate(-1, 10).toISOString() }
    },
    {
      account: "credit",
      categoryKey: "expense.shopping",
      type: "expense",
      title: "Silla ergonomica 6 cuotas",
      merchant: "Mercado Libre",
      amount: 2150,
      currency: "UYU",
      day: 10,
      hour: 14,
      paymentMethod: "credito",
      installment: { current: 3, total: 6, amountPerInstallment: 2150, remainingAmount: 6450, nextDueDate: monthDate(-1, 10).toISOString() }
    },
    {
      account: "credit",
      categoryKey: "expense.shopping",
      type: "expense",
      title: "Auriculares 3 cuotas",
      merchant: "Palacio de la Musica",
      amount: 890,
      currency: "UYU",
      day: 14,
      hour: 16,
      paymentMethod: "credito",
      installment: { current: 2, total: 3, amountPerInstallment: 890, remainingAmount: 890, nextDueDate: monthDate(-1, 10).toISOString() }
    }
  ];
}

function accountBalance(initial: number, movements: MovementSeed[], account: AccountKey) {
  return movements
    .filter((movement) => movement.account === account && movement.currency === "UYU")
    .reduce((balance, movement) => balance + (movement.type === "income" ? movement.amount : -movement.amount), initial);
}

async function seed() {
  const email = requireSampleEnv("SAMPLE_USER_EMAIL").toLowerCase();
  const password = requireSampleEnv("SAMPLE_USER_PASSWORD");

  await connectDatabase();
  await ensureSystemCategories();

  let user = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);

  if (!user) {
    user = await User.create({
      fullName: "Lucia Fernandez",
      email,
      passwordHash,
      emailVerified: true,
      isDemo: false,
      onboardingCompleted: true
    });
  } else {
    await User.updateOne(
      { _id: user._id },
      {
        fullName: "Lucia Fernandez",
        passwordHash,
        emailVerified: true,
        isDemo: false,
        onboardingCompleted: true
      }
    );
    user = await User.findById(user._id);
  }

  if (!user) throw new Error("Could not create or update sample user.");
  const userId = user._id as Types.ObjectId;

  await Promise.all([
    Account.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    FinancialProfile.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    CreditCard.deleteMany({ userId }),
    PlannerEvent.deleteMany({ userId }),
    RecurringPayment.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId })
  ]);

  await FinancialProfile.create({
    userId,
    countryCode: "UY",
    language: "es",
    locale: "es-UY",
    primaryCurrency: "UYU",
    secondaryCurrencies: ["USD"],
    incomeFrequency: "monthly",
    payday: 1,
    monthlyIncome: 92500,
    hasVariableIncome: false,
    initialBalance: 68400,
    financialGoal: "ahorrar para un fondo de emergencia",
    antExpenseThreshold: 450,
    notificationsEnabled: true,
    weeklySummaryEnabled: true
  });

  const today = new Date();
  const movements = Array.from({ length: 6 }, (_, index) =>
    monthlyMovements(index).filter((movement) => index !== 0 || movement.day <= today.getDate())
  ).flat();
  movements.push(...installmentMovements());

  const [bank, cash, usd, credit] = await Account.create([
    {
      userId,
      name: "Cuenta bancaria UYU",
      type: "bank",
      currency: "UYU",
      initialBalance: 68400,
      currentBalance: accountBalance(68400, movements, "bank"),
      isActive: true
    },
    {
      userId,
      name: "Efectivo",
      type: "cash",
      currency: "UYU",
      initialBalance: 8500,
      currentBalance: accountBalance(8500, movements, "cash"),
      isActive: true
    },
    {
      userId,
      name: "Caja de ahorro USD",
      type: "savings",
      currency: "USD",
      initialBalance: 1250,
      currentBalance: 1250,
      isActive: true
    },
    {
      userId,
      name: "Tarjeta de crédito",
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
    usd: usd._id as Types.ObjectId,
    credit: credit._id as Types.ObjectId
  };
  const categoryId = await findCategoryIds();

  await Transaction.insertMany(
    movements.map((movement, index) => {
      const date = monthDate(Math.floor(index / 20), movement.day, movement.hour);
      return {
        userId,
        accountId: accountIds[movement.account],
        categoryId: categoryId(movement.categoryKey),
        type: movement.type,
        title: movement.title,
        merchant: movement.merchant,
        amount: movement.amount,
        currency: movement.currency,
        date,
        note: movement.note || "",
        paymentMethod: movement.paymentMethod || "",
        weekday: weekday(date),
        hour: movement.hour,
        isRecurring: Boolean(movement.isRecurring),
        isAntExpense: Boolean(movement.isAntExpense),
        installment: movement.installment || undefined
      };
    })
  );

  await Goal.create({
    userId,
    name: "Fondo de emergencia",
    target: 180000,
    saved: 73500,
    currency: "UYU",
    monthlyContribution: 10500,
    accent: "lime",
    history: [5, 4, 3, 2, 1, 0].map((monthsAgo, index) => ({
      month: monthKey(monthsAgo),
      saved: 21000 + index * 10500,
      target: 180000
    }))
  });

  await CreditCard.create({
    userId,
    bank: "Banco Itau Uruguay",
    name: "Itau Visa Platinum",
    mask: "4482",
    currency: "UYU",
    limit: 120000,
    used: 58240,
    closingDate: monthDate(0, 25).toISOString(),
    dueDate: monthDate(-1, 10).toISOString(),
    nextPaymentAmount: 36890,
    accent: "blue"
  });

  await RecurringPayment.insertMany([
    { userId, merchant: "Alquiler", category: "Housing", amount: 32500, currency: "UYU", frequency: "monthly", nextChargeDate: monthDate(-1, 5), status: "confirmed", kind: "fixed", confidence: 0.99 },
    { userId, merchant: "UTE", category: "Other", amount: 2460, currency: "UYU", frequency: "monthly", nextChargeDate: monthDate(-1, 12), status: "confirmed", kind: "service", confidence: 0.96 },
    { userId, merchant: "Antel", category: "Other", amount: 2860, currency: "UYU", frequency: "monthly", nextChargeDate: monthDate(-1, 15), status: "confirmed", kind: "service", confidence: 0.96 },
    { userId, merchant: "Netflix", category: "Entertainment", amount: 520, currency: "UYU", frequency: "monthly", nextChargeDate: monthDate(-1, 22), status: "pending", kind: "subscription", confidence: 0.91 }
  ]);

  await PlannerEvent.insertMany([
    { userId, title: "Cobro sueldo", date: monthDate(-1, 1, 10), time: "10:00", category: "Ingreso", done: false, accent: "lime" },
    { userId, title: "Vencimiento tarjeta", date: monthDate(-1, 10, 9), time: "09:00", category: "Tarjeta", done: false, accent: "orange" },
    { userId, title: "Pagar UTE", date: monthDate(-1, 12, 18), time: "18:00", category: "Servicio", done: false, accent: "blue" },
    { userId, title: "Pagar Antel", date: monthDate(-1, 15, 18), time: "18:00", category: "Servicio", done: false, accent: "blue" },
    { userId, title: "Cuota notebook", date: monthDate(-1, 10, 12), time: "12:00", category: "Cuota", done: false, accent: "black" },
    { userId, title: "Transferir a fondo de emergencia", date: monthDate(-1, 2, 10), time: "10:30", category: "Ahorro", done: false, accent: "lime" }
  ]);

  logger.info("Presentation sample user seeded.", {
    userId: userId.toString(),
    accounts: 4,
    months: 6,
    movements: movements.length
  });

  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("Presentation sample seed failed.", { error: error instanceof Error ? error.message : "Unknown error" });
  await disconnectDatabase();
  process.exit(1);
});
