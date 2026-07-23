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

type DemoMovement = {
  account: "bank" | "cash" | "savings";
  amount: number;
  categoryKey: string;
  day: number;
  hour?: number;
  isAntExpense?: boolean;
  isRecurring?: boolean;
  merchant: string;
  month: number;
  note?: string;
  paymentMethod?: string;
  status?: "completed" | "paid" | "received";
  title: string;
  type: "expense" | "goal_contribution" | "income" | "refund";
};

const movements: DemoMovement[] = [
  { account: "bank", amount: 54_000, categoryKey: "income.salary", day: 1, isRecurring: true, merchant: "Estudio Creativo", month: 2, paymentMethod: "bank_transfer", status: "received", title: "Sueldo", type: "income" },
  { account: "bank", amount: 18_000, categoryKey: "expense.home_services", day: 5, isRecurring: true, merchant: "Alquiler", month: 2, paymentMethod: "bank_transfer", status: "paid", title: "Alquiler", type: "expense" },
  { account: "bank", amount: 7_850, categoryKey: "expense.food", day: 8, merchant: "Tienda Inglesa", month: 2, paymentMethod: "debit_card", status: "paid", title: "Supermercado", type: "expense" },
  { account: "cash", amount: 190, categoryKey: "expense.food", day: 11, hour: 10, isAntExpense: true, merchant: "Café Brasilero", month: 2, paymentMethod: "cash", status: "paid", title: "Café", type: "expense" },
  { account: "bank", amount: 2_990, categoryKey: "expense.transport", day: 14, merchant: "STM y Uber", month: 2, paymentMethod: "debit_card", status: "paid", title: "Transporte", type: "expense" },
  { account: "bank", amount: 1_590, categoryKey: "expense.subscriptions", day: 20, isRecurring: true, merchant: "Netflix y Spotify", month: 2, paymentMethod: "credit_card", status: "paid", title: "Suscripciones", type: "expense" },

  { account: "bank", amount: 56_000, categoryKey: "income.salary", day: 1, isRecurring: true, merchant: "Estudio Creativo", month: 3, paymentMethod: "bank_transfer", status: "received", title: "Sueldo", type: "income" },
  { account: "bank", amount: 6_500, categoryKey: "income.freelance", day: 3, merchant: "Proyecto freelance", month: 3, paymentMethod: "bank_transfer", status: "received", title: "Ingreso freelance", type: "income" },
  { account: "bank", amount: 18_000, categoryKey: "expense.home_services", day: 5, isRecurring: true, merchant: "Alquiler", month: 3, paymentMethod: "bank_transfer", status: "paid", title: "Alquiler", type: "expense" },
  { account: "bank", amount: 8_240, categoryKey: "expense.food", day: 9, merchant: "Disco", month: 3, paymentMethod: "debit_card", status: "paid", title: "Supermercado", type: "expense" },
  { account: "cash", amount: 260, categoryKey: "expense.food", day: 12, hour: 17, isAntExpense: true, merchant: "La Pasiva", month: 3, paymentMethod: "cash", status: "paid", title: "Merienda", type: "expense" },
  { account: "bank", amount: 3_100, categoryKey: "expense.leisure", day: 18, merchant: "Salida con amigos", month: 3, paymentMethod: "debit_card", status: "paid", title: "Salida", type: "expense" },
  { account: "bank", amount: 2_300, categoryKey: "expense.health", day: 23, merchant: "Farmacia", month: 3, paymentMethod: "debit_card", status: "paid", title: "Farmacia", type: "expense" },
  { account: "savings", amount: 5_000, categoryKey: "expense.other", day: 27, merchant: "Fondo de emergencia", month: 3, note: "Aporte mensual", paymentMethod: "bank_transfer", status: "completed", title: "Aporte a meta", type: "goal_contribution" },

  { account: "bank", amount: 56_000, categoryKey: "income.salary", day: 1, isRecurring: true, merchant: "Estudio Creativo", month: 4, paymentMethod: "bank_transfer", status: "received", title: "Sueldo", type: "income" },
  { account: "bank", amount: 18_000, categoryKey: "expense.home_services", day: 5, isRecurring: true, merchant: "Alquiler", month: 4, paymentMethod: "bank_transfer", status: "paid", title: "Alquiler", type: "expense" },
  { account: "bank", amount: 8_980, categoryKey: "expense.food", day: 8, merchant: "Devoto", month: 4, paymentMethod: "debit_card", status: "paid", title: "Supermercado", type: "expense" },
  { account: "bank", amount: 1_250, categoryKey: "expense.food", day: 13, merchant: "PedidosYa", month: 4, paymentMethod: "debit_card", status: "paid", title: "Cena", type: "expense" },
  { account: "cash", amount: 210, categoryKey: "expense.food", day: 16, hour: 9, isAntExpense: true, merchant: "Café de la esquina", month: 4, paymentMethod: "cash", status: "paid", title: "Café", type: "expense" },
  { account: "bank", amount: 4_700, categoryKey: "expense.education", day: 19, merchant: "Curso online", month: 4, paymentMethod: "credit_card", status: "paid", title: "Curso de diseño", type: "expense" },
  { account: "bank", amount: 1_800, categoryKey: "expense.home_services", day: 27, isRecurring: true, merchant: "Antel", month: 4, paymentMethod: "debit_card", status: "paid", title: "Internet", type: "expense" },
  { account: "savings", amount: 7_000, categoryKey: "expense.other", day: 29, merchant: "Viaje a Brasil", month: 4, note: "Ahorro para viaje", paymentMethod: "bank_transfer", status: "completed", title: "Aporte a meta", type: "goal_contribution" },

  { account: "bank", amount: 58_000, categoryKey: "income.salary", day: 1, isRecurring: true, merchant: "Estudio Creativo", month: 5, paymentMethod: "bank_transfer", status: "received", title: "Sueldo", type: "income" },
  { account: "bank", amount: 4_800, categoryKey: "income.freelance", day: 4, merchant: "Diseño de identidad", month: 5, paymentMethod: "bank_transfer", status: "received", title: "Trabajo freelance", type: "income" },
  { account: "bank", amount: 18_000, categoryKey: "expense.home_services", day: 5, isRecurring: true, merchant: "Alquiler", month: 5, paymentMethod: "bank_transfer", status: "paid", title: "Alquiler", type: "expense" },
  { account: "bank", amount: 7_920, categoryKey: "expense.food", day: 9, merchant: "Tata", month: 5, paymentMethod: "debit_card", status: "paid", title: "Supermercado", type: "expense" },
  { account: "bank", amount: 3_350, categoryKey: "expense.transport", day: 12, merchant: "STM y Uber", month: 5, paymentMethod: "debit_card", status: "paid", title: "Transporte", type: "expense" },
  { account: "cash", amount: 340, categoryKey: "expense.food", day: 15, hour: 16, isAntExpense: true, merchant: "Merienda", month: 5, paymentMethod: "cash", status: "paid", title: "Café y medialuna", type: "expense" },
  { account: "bank", amount: 2_750, categoryKey: "expense.shopping", day: 21, merchant: "H&M", month: 5, paymentMethod: "credit_card", status: "paid", title: "Ropa", type: "expense" },
  { account: "bank", amount: 890, categoryKey: "income.refund", day: 25, merchant: "Devolución de compra", month: 5, paymentMethod: "debit_card", status: "received", title: "Reintegro", type: "refund" },
  { account: "savings", amount: 5_000, categoryKey: "expense.other", day: 28, merchant: "Fondo de emergencia", month: 5, note: "Aporte mensual", paymentMethod: "bank_transfer", status: "completed", title: "Aporte a meta", type: "goal_contribution" },

  { account: "bank", amount: 58_000, categoryKey: "income.salary", day: 1, isRecurring: true, merchant: "Estudio Creativo", month: 6, paymentMethod: "bank_transfer", status: "received", title: "Sueldo", type: "income" },
  { account: "bank", amount: 18_000, categoryKey: "expense.home_services", day: 5, isRecurring: true, merchant: "Alquiler", month: 6, paymentMethod: "bank_transfer", status: "paid", title: "Alquiler", type: "expense" },
  { account: "bank", amount: 8_500, categoryKey: "expense.food", day: 8, merchant: "Supermercado", month: 6, paymentMethod: "debit_card", status: "paid", title: "Supermercado", type: "expense" },
  { account: "bank", amount: 3_200, categoryKey: "expense.transport", day: 10, merchant: "STM y traslados", month: 6, paymentMethod: "debit_card", status: "paid", title: "Transporte", type: "expense" },
  { account: "bank", amount: 4_300, categoryKey: "expense.home_services", day: 12, merchant: "UTE y OSE", month: 6, paymentMethod: "bank_transfer", status: "paid", title: "Servicios del hogar", type: "expense" },
  { account: "bank", amount: 2_500, categoryKey: "expense.leisure", day: 16, merchant: "Salidas", month: 6, paymentMethod: "debit_card", status: "paid", title: "Salida con amigos", type: "expense" },
  { account: "cash", amount: 320, categoryKey: "expense.food", day: 17, hour: 10, isAntExpense: true, merchant: "Café", month: 6, paymentMethod: "cash", status: "paid", title: "Café", type: "expense" },
  { account: "bank", amount: 650, categoryKey: "expense.food", day: 18, hour: 21, isAntExpense: true, merchant: "PedidosYa", month: 6, paymentMethod: "debit_card", status: "paid", title: "Delivery", type: "expense" },
  { account: "bank", amount: 420, categoryKey: "expense.food", day: 19, hour: 17, isAntExpense: true, merchant: "Kiosco", month: 6, paymentMethod: "cash", status: "paid", title: "Merienda", type: "expense" },
  { account: "bank", amount: 2_000, categoryKey: "expense.shopping", day: 20, merchant: "Celular", month: 6, note: "Última cuota pagada: 3 de 12", paymentMethod: "credit_card", status: "paid", title: "Celular · Cuota 3 de 12", type: "expense" },
  { account: "savings", amount: 6_000, categoryKey: "expense.other", day: 21, merchant: "Fondo de emergencia", month: 6, note: "Aporte mensual", paymentMethod: "bank_transfer", status: "completed", title: "Aporte a meta", type: "goal_contribution" }
];

function date(year: number, month: number, day: number, hour = 12) {
  return new Date(year, month, day, hour, 0, 0, 0);
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

    // La semilla reemplaza únicamente los datos financieros de las cuentas de presentación.
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
      secondaryCurrencies: ["USD"],
      profileSetupStep: 4,
      incomeFrequency: "monthly",
      payday: 1,
      monthlyIncome: 58_000,
      hasVariableIncome: true,
      initialBalance: 9_500,
      financialGoal: "Ahorrar sin perder el control de los pagos del mes",
      primaryGoal: "Fondo de emergencia",
      antExpenseThreshold: 700,
      notificationsEnabled: true,
      weeklySummaryEnabled: true
    });

    const [bank, cash, savings, credit] = await Account.create([
      { userId, name: "Cuenta principal", type: "bank", currency: "UYU", initialBalance: 9_500, currentBalance: 23_720, isActive: true },
      { userId, name: "Efectivo", type: "cash", currency: "UYU", initialBalance: 2_000, currentBalance: 1_140, isActive: true },
      { userId, name: "Ahorros", type: "savings", currency: "UYU", initialBalance: 12_000, currentBalance: 48_500, isActive: true },
      { userId, name: "Visa Itaú", type: "credit", currency: "UYU", initialBalance: 0, currentBalance: 0, isActive: true }
    ]);
    const accounts = { bank, cash, savings, credit };

    const ids = await categoryIds();
    const rows = movements.map((movement, index) => {
      const categoryId = ids.get(movement.categoryKey);
      if (!categoryId) throw new Error(`Missing category ${movement.categoryKey}.`);
      const movementDate = date(2026, movement.month, movement.day, movement.hour ?? 12);
      return {
        userId,
        accountId: accounts[movement.account]._id,
        categoryId,
        demoId: `demo-${targetEmail}-${movement.month + 1}-${movement.day}-${index}`,
        type: movement.type,
        status: movement.status || (movement.type === "income" || movement.type === "refund" ? "received" : movement.type === "expense" ? "paid" : "completed"),
        title: movement.title,
        merchant: movement.merchant,
        amount: movement.amount,
        currency: "UYU",
        date: movementDate,
        note: movement.note || "",
        paymentMethod: movement.paymentMethod || "debit_card",
        weekday: movementDate.toLocaleDateString("es-UY", { weekday: "long" }),
        hour: movementDate.getHours(),
        isRecurring: movement.isRecurring || false,
        isAntExpense: movement.isAntExpense || false
      };
    });
    await Transaction.insertMany(rows);

    await CreditCard.create([
      {
        userId,
        bank: "Itaú",
        name: "Visa Itaú",
        mask: "•••• 4821",
        currency: "UYU",
        limit: 85_000,
        used: 18_940,
        closingDate: "2026-07-30",
        dueDate: "2026-08-10",
        nextPaymentAmount: 12_650,
        accent: "orange"
      },
      {
        userId,
        bank: "OCA",
        name: "OCA Blue",
        mask: "•••• 7316",
        currency: "UYU",
        limit: 45_000,
        used: 7_480,
        closingDate: "2026-08-03",
        dueDate: "2026-08-15",
        nextPaymentAmount: 7_480,
        accent: "blue"
      }
    ]);

    await Goal.create([
      {
        userId,
        name: "Fondo de emergencia",
        target: 120_000,
        saved: 48_500,
        currency: "UYU",
        monthlyContribution: 6_000,
        targetDate: date(2027, 1, 28),
        status: "active",
        accent: "lime",
        history: [
          { month: "Marzo", saved: 25_000, target: 120_000 },
          { month: "Abril", saved: 30_000, target: 120_000 },
          { month: "Mayo", saved: 37_000, target: 120_000 },
          { month: "Junio", saved: 42_500, target: 120_000 },
          { month: "Julio", saved: 48_500, target: 120_000 }
        ]
      },
      {
        userId,
        name: "Viaje a Brasil",
        target: 70_000,
        saved: 38_000,
        currency: "UYU",
        monthlyContribution: 7_000,
        targetDate: date(2026, 11, 15),
        status: "active",
        accent: "orange",
        history: [
          { month: "Abril", saved: 10_000, target: 70_000 },
          { month: "Mayo", saved: 17_000, target: 70_000 },
          { month: "Junio", saved: 28_000, target: 70_000 },
          { month: "Julio", saved: 38_000, target: 70_000 }
        ]
      },
      {
        userId,
        name: "Nueva notebook",
        target: 65_000,
        saved: 14_000,
        currency: "UYU",
        monthlyContribution: 4_000,
        targetDate: date(2027, 4, 1),
        status: "paused",
        accent: "lavender",
        history: [
          { month: "Mayo", saved: 10_000, target: 65_000 },
          { month: "Junio", saved: 14_000, target: 65_000 }
        ]
      },
      {
        userId,
        name: "Curso de UX",
        target: 18_000,
        saved: 18_000,
        currency: "UYU",
        monthlyContribution: 3_000,
        targetDate: date(2026, 5, 30),
        status: "completed",
        accent: "blue",
        history: [
          { month: "Marzo", saved: 6_000, target: 18_000 },
          { month: "Abril", saved: 12_000, target: 18_000 },
          { month: "Mayo", saved: 18_000, target: 18_000 }
        ]
      }
    ]);

    const paidPhoneTransactions = await Transaction.find({ userId, title: /Celular · Cuota/ }).sort({ date: 1 });
    const phoneInstallments = Array.from({ length: 12 }, (_, index) => ({
      number: index + 1,
      amount: 2_000,
      dueDate: date(2026, 3 + index, 26),
      status: index < 3 ? "paid" : "pending",
      paidAt: index < 3 ? date(2026, 3 + index, 20) : null,
      transactionId: index === 2 ? paidPhoneTransactions[0]?._id : null
    }));
    const notebookInstallments = Array.from({ length: 6 }, (_, index) => ({
      number: index + 1,
      amount: 5_500,
      dueDate: date(2026, 5 + index, 19),
      status: index < 2 ? "paid" : "pending",
      paidAt: index < 2 ? date(2026, 5 + index, 18) : null,
      transactionId: null
    }));

    const [phonePurchase, notebookPurchase] = await InstallmentPurchase.create([
      {
        userId,
        accountId: credit._id,
        name: "Celular",
        category: "compras",
        cardName: "Visa Itaú",
        note: "Compra del celular de uso diario",
        totalAmount: 24_000,
        installmentAmount: 2_000,
        totalInstallments: 12,
        paidInstallments: 3,
        currency: "UYU",
        firstDueDate: date(2026, 3, 26),
        reminderDaysBefore: 3,
        status: "active",
        installments: phoneInstallments
      },
      {
        userId,
        accountId: credit._id,
        name: "Notebook para estudiar",
        category: "educación",
        cardName: "OCA Blue",
        note: "Equipo para facultad y trabajos freelance",
        totalAmount: 33_000,
        installmentAmount: 5_500,
        totalInstallments: 6,
        paidInstallments: 2,
        currency: "UYU",
        firstDueDate: date(2026, 5, 19),
        reminderDaysBefore: 5,
        status: "active",
        installments: notebookInstallments
      }
    ]);

    const [internet, rent, netflix, gym, freelance] = await RecurringPayment.create([
      {
        userId,
        accountId: bank._id,
        categoryId: ids.get("expense.home_services"),
        merchant: "Internet",
        category: "servicios",
        amount: 1_800,
        currency: "UYU",
        frequency: "monthly",
        nextChargeDate: date(2026, 6, 28),
        reminderDaysBefore: 1,
        notificationsEnabled: true,
        status: "pending",
        kind: "service",
        confidence: 1,
        active: true
      },
      {
        userId,
        accountId: bank._id,
        categoryId: ids.get("expense.home_services"),
        merchant: "Alquiler",
        category: "hogar y servicios",
        amount: 18_000,
        currency: "UYU",
        frequency: "monthly",
        nextChargeDate: date(2026, 7, 5),
        reminderDaysBefore: 3,
        notificationsEnabled: true,
        status: "pending",
        kind: "fixed",
        confidence: 1,
        active: true
      },
      {
        userId,
        accountId: credit._id,
        categoryId: ids.get("expense.subscriptions"),
        merchant: "Netflix",
        category: "suscripciones",
        amount: 790,
        currency: "UYU",
        frequency: "monthly",
        nextChargeDate: date(2026, 6, 25),
        reminderDaysBefore: 1,
        notificationsEnabled: true,
        status: "pending",
        kind: "subscription",
        confidence: 0.98,
        priceChange: 100,
        active: true
      },
      {
        userId,
        accountId: credit._id,
        categoryId: ids.get("expense.health"),
        merchant: "Gimnasio",
        category: "salud",
        amount: 1_950,
        currency: "UYU",
        frequency: "monthly",
        nextChargeDate: date(2026, 6, 30),
        reminderDaysBefore: 2,
        notificationsEnabled: true,
        status: "confirmed",
        kind: "subscription",
        confidence: 0.96,
        active: true
      },
      {
        userId,
        accountId: bank._id,
        categoryId: ids.get("income.freelance"),
        merchant: "Cliente freelance",
        category: "freelance",
        amount: 8_000,
        currency: "UYU",
        frequency: "once",
        nextChargeDate: date(2026, 6, 30),
        reminderDaysBefore: 2,
        notificationsEnabled: true,
        status: "pending",
        kind: "income",
        confidence: 1,
        active: true
      }
    ]);

    await PlannerEvent.create([
      { userId, title: "Revisar presupuesto semanal", date: date(2026, 6, 24), time: "19:00", category: "Finanzas", done: false, accent: "orange" },
      { userId, title: "Separar ahorro para Brasil", date: date(2026, 6, 27), time: "18:30", category: "Metas", done: false, accent: "lime" },
      { userId, title: "Revisar estado de cuenta", date: date(2026, 6, 30), time: "20:00", category: "Tarjetas", done: false, accent: "blue" },
      { userId, title: "Resumen financiero de junio", date: date(2026, 6, 2), time: "19:00", category: "Finanzas", done: true, accent: "black" }
    ]);

    const phoneNext = phonePurchase.installments.find((item) => item.status === "pending");
    const notebookNext = notebookPurchase.installments.find((item) => item.status === "pending");
    await Notification.create([
      {
        userId,
        type: "payment_reminder",
        title: "Netflix vence en 2 días",
        message: "Tenés que pagar $U 790 el 25 de julio.",
        status: "pending",
        priority: "high",
        scheduledFor: date(2026, 6, 23, 9),
        relatedEntityType: "payment",
        relatedEntityId: netflix._id,
        actionType: "open_payment",
        metadata: { amount: 790, currency: "UYU", dueDate: date(2026, 6, 25).toISOString(), kind: "payment", name: "Netflix" },
        dedupeKey: `demo-netflix-${targetEmail}`
      },
      {
        userId,
        type: "payment_reminder",
        title: "Internet vence pronto",
        message: "Tenés que pagar $U 1.800 el 28 de julio.",
        status: "pending",
        priority: "normal",
        scheduledFor: date(2026, 6, 23, 9),
        relatedEntityType: "payment",
        relatedEntityId: internet._id,
        actionType: "open_payment",
        metadata: { amount: 1_800, currency: "UYU", dueDate: date(2026, 6, 28).toISOString(), kind: "payment", name: "Internet" },
        dedupeKey: `demo-internet-${targetEmail}`
      },
      {
        userId,
        type: "installment_due",
        title: "Cuota próxima",
        message: `La cuota ${phoneNext?.number} de ${phonePurchase.totalInstallments} del celular vence pronto.`,
        status: "pending",
        priority: "normal",
        scheduledFor: date(2026, 6, 22, 9),
        relatedEntityType: "installment",
        relatedEntityId: phonePurchase._id,
        actionType: "open_installment",
        metadata: { amount: phoneNext?.amount, currency: "UYU", dueDate: phoneNext?.dueDate?.toISOString(), installmentId: phoneNext?._id?.toString(), installmentNumber: phoneNext?.number, name: "Celular", totalInstallments: phonePurchase.totalInstallments },
        dedupeKey: `demo-phone-installment-${targetEmail}`
      },
      {
        userId,
        type: "installment_due",
        title: "Cuota de notebook próxima",
        message: `La cuota ${notebookNext?.number} de la notebook vence el 19 de agosto.`,
        status: "read",
        priority: "normal",
        readAt: date(2026, 6, 22, 18),
        scheduledFor: date(2026, 6, 21, 9),
        relatedEntityType: "installment",
        relatedEntityId: notebookPurchase._id,
        actionType: "open_installment",
        metadata: { amount: notebookNext?.amount, currency: "UYU", dueDate: notebookNext?.dueDate?.toISOString(), installmentId: notebookNext?._id?.toString(), installmentNumber: notebookNext?.number, name: "Notebook", totalInstallments: notebookPurchase.totalInstallments },
        dedupeKey: `demo-notebook-installment-${targetEmail}`
      },
      {
        userId,
        type: "income_reminder",
        title: "Confirmá tu ingreso",
        message: "¿Ya recibiste el pago freelance de $U 8.000?",
        status: "pending",
        priority: "normal",
        scheduledFor: date(2026, 6, 23, 10),
        relatedEntityType: "payment",
        relatedEntityId: freelance._id,
        actionType: "open_payment",
        metadata: { amount: 8_000, currency: "UYU", dueDate: date(2026, 6, 30).toISOString(), kind: "income", name: "Cliente freelance" },
        dedupeKey: `demo-freelance-${targetEmail}`
      },
      {
        userId,
        type: "payment_reminder",
        title: "Tu alquiler vence en 13 días",
        message: "Tenés un pago pendiente de $U 18.000.",
        status: "read",
        priority: "low",
        readAt: date(2026, 6, 22, 12),
        scheduledFor: date(2026, 6, 22, 9),
        relatedEntityType: "payment",
        relatedEntityId: rent._id,
        actionType: "open_payment",
        metadata: { amount: 18_000, currency: "UYU", dueDate: date(2026, 7, 5).toISOString(), kind: "payment", name: "Alquiler" },
        dedupeKey: `demo-rent-${targetEmail}`
      },
      {
        userId,
        type: "payment_reminder",
        title: "Gimnasio próximo",
        message: "El pago mensual de $U 1.950 vence el 30 de julio.",
        status: "completed",
        priority: "normal",
        readAt: date(2026, 6, 20, 12),
        scheduledFor: date(2026, 6, 20, 9),
        relatedEntityType: "payment",
        relatedEntityId: gym._id,
        actionType: "open_payment",
        metadata: { amount: 1_950, currency: "UYU", dueDate: date(2026, 6, 30).toISOString(), kind: "payment", name: "Gimnasio" },
        dedupeKey: `demo-gym-completed-${targetEmail}`
      }
    ]);

    const income = rows.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0);
    const expenses = rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0);
    logger.info("Presentation user seeded with complete history.", {
      accounts: 4,
      creditCards: 2,
      email: targetEmail,
      expenses,
      goals: 4,
      income,
      installmentPurchases: 2,
      notifications: 7,
      recurringPayments: 5,
      transactions: rows.length,
      userId: userId.toString()
    });
  }
  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("Presentation sample seed failed.", { error: error instanceof Error ? error.message : "Unknown error" });
  await disconnectDatabase();
  process.exit(1);
});
