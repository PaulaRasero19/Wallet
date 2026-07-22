import mongoose, { Types } from "mongoose";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { FinancialProfile } from "../models/FinancialProfile";
import { Transaction } from "../models/Transaction";
import { AppError } from "../utils/appError";
import { essentialAntExpenseCategoryKeys } from "./categorySeedService";
import { accountDTO, transactionDTO } from "./serializers";

type TransactionInput = Record<string, unknown>;

function impact(type: "income" | "expense" | "transfer", amount: number) {
  if (type === "income") return amount;
  if (type === "expense") return -amount;
  return 0;
}

function normalizeTransaction(input: TransactionInput) {
  return {
    accountId: String(input.accountId || input.account_id),
    categoryId: input.categoryId || input.category_id ? String(input.categoryId || input.category_id) : "",
    type: input.type as "income" | "expense" | "transfer",
    title: String(input.title || ""),
    merchant: String(input.merchant || input.title || ""),
    amount: Math.abs(Number(input.amount)),
    currency: input.currency as "UYU" | "USD" | "EUR",
    date: new Date(String(input.date || new Date().toISOString())),
    note: String(input.note || ""),
    paymentMethod: String(input.paymentMethod || input.payment_method || ""),
    isRecurring: Boolean(input.isRecurring ?? input.is_recurring ?? false),
    isAntExpense: input.isAntExpense ?? input.is_ant_expense,
    installment: input.installment as
      | {
          current?: number;
          total?: number;
          amountPerInstallment?: number;
          remainingAmount?: number;
          nextDueDate?: string;
        }
      | undefined
  };
}

async function assertAccount(userId: Types.ObjectId, accountId: string) {
  const account = await Account.findOne({ _id: accountId, userId, isActive: true });
  if (!account) {
    throw new AppError("Cuenta no encontrada.", 404, "ACCOUNT_NOT_FOUND");
  }
  return account;
}

async function assertCategory(userId: Types.ObjectId, categoryId: string, type: "income" | "expense") {
  const category = await Category.findOne({
    _id: categoryId,
    type,
    isActive: true,
    $or: [{ isSystem: true, userId: null }, { userId }]
  });

  if (!category) {
    throw new AppError("Categoría no encontrada para este tipo de movimiento.", 404, "CATEGORY_NOT_FOUND");
  }

  return category;
}

async function shouldBeAntExpense(userId: Types.ObjectId, categoryId: string, type: "income" | "expense", amount: number) {
  if (type !== "expense") return false;

  const [profile, category] = await Promise.all([FinancialProfile.findOne({ userId }), Category.findById(categoryId)]);
  if (!profile || !category) return false;
  if (essentialAntExpenseCategoryKeys.has(category.translationKey)) return false;

  return amount <= profile.antExpenseThreshold;
}

export async function listTransactions(userId: Types.ObjectId, filters: Record<string, unknown>) {
  const query: Record<string, unknown> = { userId };
  if (filters.type) query.type = filters.type;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.accountId) query.accountId = filters.accountId;
  if (filters.currency) query.currency = filters.currency;
  if (typeof filters.isAntExpense === "boolean") query.isAntExpense = filters.isAntExpense;
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) (query.date as Record<string, unknown>).$gte = filters.dateFrom;
    if (filters.dateTo) (query.date as Record<string, unknown>).$lte = filters.dateTo;
  }
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { merchant: { $regex: filters.search, $options: "i" } },
      { note: { $regex: filters.search, $options: "i" } }
    ];
  }

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 30);
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    date_desc: { date: -1 },
    date_asc: { date: 1 },
    amount_desc: { amount: -1 },
    amount_asc: { amount: 1 }
  };

  const [items, total] = await Promise.all([
    Transaction.find(query)
      .sort(sortMap[String(filters.sort || "date_desc")])
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(query)
  ]);

  return {
    transactions: items.map(transactionDTO),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

export async function createTransaction(userId: Types.ObjectId, input: TransactionInput) {
  const data = normalizeTransaction(input);
  if (data.type === "transfer") {
    throw new AppError("Usá el endpoint de transferencias para mover dinero entre cuentas.", 400, "TRANSFER_ENDPOINT_REQUIRED");
  }
  const account = await assertAccount(userId, data.accountId);
  const category = await assertCategory(userId, data.categoryId, data.type);

  if (account.currency !== data.currency) {
    throw new AppError("La moneda del movimiento debe coincidir con la cuenta.", 400, "CURRENCY_MISMATCH");
  }

  const isAntExpense = typeof data.isAntExpense === "boolean" ? data.isAntExpense : await shouldBeAntExpense(userId, data.categoryId, data.type, data.amount);

  const session = await mongoose.startSession();
  let transaction;
  try {
    await session.withTransaction(async () => {
      [transaction] = await Transaction.create(
        [
          {
            userId,
            accountId: account._id,
            categoryId: category._id,
            type: data.type,
            title: data.title,
            merchant: data.merchant,
            amount: data.amount,
            currency: data.currency,
            date: data.date,
            note: data.note,
            paymentMethod: data.paymentMethod,
            isRecurring: data.isRecurring,
            isAntExpense,
            installment: data.installment
          }
        ],
        { session }
      );
      account.currentBalance += impact(data.type, data.amount);
      await account.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { transaction: transactionDTO(transaction!), account: accountDTO(account) };
}

export async function createTransfer(userId: Types.ObjectId, input: TransactionInput) {
  const fromAccountId = String(input.fromAccountId || input.accountId || input.account_id || "");
  const toAccountId = String(input.toAccountId || input.to_account_id || "");
  const amount = Math.abs(Number(input.amount));
  const currency = input.currency as "UYU" | "USD" | "EUR";
  const date = new Date(String(input.date || new Date().toISOString()));
  const title = String(input.title || "Transferencia");
  const note = String(input.note || "");

  if (fromAccountId === toAccountId) {
    throw new AppError("La cuenta origen y destino deben ser diferentes.", 400, "SAME_ACCOUNT_TRANSFER");
  }

  const [fromAccount, toAccount] = await Promise.all([assertAccount(userId, fromAccountId), assertAccount(userId, toAccountId)]);
  if (fromAccount.currency !== currency || toAccount.currency !== currency) {
    throw new AppError("La moneda debe coincidir con ambas cuentas.", 400, "CURRENCY_MISMATCH");
  }

  const transferGroupId = new Types.ObjectId().toString();
  const session = await mongoose.startSession();
  let transaction;
  try {
    await session.withTransaction(async () => {
      [transaction] = await Transaction.create(
        [
          {
            userId,
            accountId: fromAccount._id,
            toAccountId: toAccount._id,
            transferGroupId,
            categoryId: null,
            type: "transfer",
            title,
            merchant: title,
            amount,
            currency,
            date,
            note,
            paymentMethod: "transferencia",
            isRecurring: false,
            isAntExpense: false
          }
        ],
        { session }
      );
      fromAccount.currentBalance -= amount;
      toAccount.currentBalance += amount;
      await fromAccount.save({ session });
      await toAccount.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return {
    transaction: transactionDTO(transaction!),
    accounts: [accountDTO(fromAccount), accountDTO(toAccount)]
  };
}

export async function getTransaction(userId: Types.ObjectId, id: string) {
  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) throw new AppError("Movimiento no encontrado.", 404, "TRANSACTION_NOT_FOUND");
  return transactionDTO(transaction);
}

export async function updateTransaction(userId: Types.ObjectId, id: string, input: TransactionInput) {
  const existing = await Transaction.findOne({ _id: id, userId });
  if (!existing) throw new AppError("Movimiento no encontrado.", 404, "TRANSACTION_NOT_FOUND");

  const next = { ...existing.toObject(), ...normalizeTransaction({ ...existing.toObject(), ...input }) };
  const oldAccount = await assertAccount(userId, existing.accountId.toString());
  const newAccount = await assertAccount(userId, String(next.accountId));
  if (next.type === "transfer" || existing.type === "transfer") {
    throw new AppError("Las transferencias se editan desde el flujo de transferencia.", 400, "TRANSFER_EDIT_UNSUPPORTED");
  }
  const category = await assertCategory(userId, String(next.categoryId), next.type);

  if (newAccount.currency !== next.currency) {
    throw new AppError("La moneda del movimiento debe coincidir con la cuenta.", 400, "CURRENCY_MISMATCH");
  }

  const isAntExpense =
    typeof input.isAntExpense === "boolean" || typeof input.is_ant_expense === "boolean"
      ? Boolean(input.isAntExpense ?? input.is_ant_expense)
      : await shouldBeAntExpense(userId, String(next.categoryId), next.type, next.amount);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      oldAccount.currentBalance -= impact(existing.type, existing.amount);
      await oldAccount.save({ session });
      newAccount.currentBalance += impact(next.type, next.amount);
      await newAccount.save({ session });

      existing.accountId = newAccount._id;
      existing.categoryId = category._id;
      existing.type = next.type;
      existing.title = next.title;
      existing.merchant = next.merchant;
      existing.amount = next.amount;
      existing.currency = next.currency;
      existing.date = next.date;
      existing.note = next.note;
      existing.paymentMethod = next.paymentMethod;
      existing.isRecurring = next.isRecurring;
      existing.isAntExpense = isAntExpense;
      existing.installment = next.installment || null;
      await existing.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { transaction: transactionDTO(existing), account: accountDTO(newAccount) };
}

export async function deleteTransaction(userId: Types.ObjectId, id: string) {
  const existing = await Transaction.findOne({ _id: id, userId });
  if (!existing) throw new AppError("Movimiento no encontrado.", 404, "TRANSACTION_NOT_FOUND");
  const account = await assertAccount(userId, existing.accountId.toString());
  const toAccount = existing.toAccountId ? await assertAccount(userId, existing.toAccountId.toString()) : null;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (existing.type === "transfer" && toAccount) {
        account.currentBalance += existing.amount;
        toAccount.currentBalance -= existing.amount;
        await toAccount.save({ session });
      } else {
        account.currentBalance -= impact(existing.type, existing.amount);
      }
      await account.save({ session });
      await existing.deleteOne({ session });
    });
  } finally {
    await session.endSession();
  }

  return { account: accountDTO(account), accounts: toAccount ? [accountDTO(account), accountDTO(toAccount)] : [accountDTO(account)] };
}
