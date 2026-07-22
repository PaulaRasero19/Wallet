import { Types } from "mongoose";
import { Account } from "../models/Account";
import { Transaction } from "../models/Transaction";
import { AppError } from "../utils/appError";
import { accountDTO } from "./serializers";

export async function listAccounts(userId: Types.ObjectId) {
  const accounts = await Account.find({ userId, isActive: true }).sort({ createdAt: 1 });
  return accounts.map(accountDTO);
}

export async function createAccount(userId: Types.ObjectId, input: Record<string, unknown>) {
  const initialBalance = Number(input.initialBalance ?? input.initial_balance ?? 0);
  const account = await Account.create({
    userId,
    name: String(input.name),
    type: (input.type || "cash") as "cash" | "bank" | "savings" | "wallet" | "credit" | "other",
    currency: input.currency as "UYU" | "USD" | "EUR",
    initialBalance,
    currentBalance: initialBalance,
    isActive: true
  });
  return accountDTO(account);
}

export async function getAccount(userId: Types.ObjectId, id: string) {
  const account = await Account.findOne({ _id: id, userId, isActive: true });
  if (!account) {
    throw new AppError("Cuenta no encontrada.", 404, "ACCOUNT_NOT_FOUND");
  }
  return accountDTO(account);
}

export async function updateAccount(userId: Types.ObjectId, id: string, input: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  if (input.name) update.name = input.name;
  if (input.type) update.type = input.type;
  if (input.currency) update.currency = input.currency;
  if (typeof input.isActive === "boolean" || typeof input.is_active === "boolean") update.isActive = input.isActive ?? input.is_active;

  const account = await Account.findOneAndUpdate({ _id: id, userId }, update, { returnDocument: "after" });
  if (!account) {
    throw new AppError("Cuenta no encontrada.", 404, "ACCOUNT_NOT_FOUND");
  }
  return accountDTO(account);
}

export async function deleteAccount(userId: Types.ObjectId, id: string) {
  const hasTransactions = await Transaction.exists({ accountId: id, userId });
  if (hasTransactions) {
    throw new AppError("No se puede eliminar una cuenta con movimientos. Primero definí una estrategia de migración.", 409, "ACCOUNT_HAS_TRANSACTIONS");
  }

  const account = await Account.findOneAndUpdate({ _id: id, userId }, { isActive: false }, { returnDocument: "after" });
  if (!account) {
    throw new AppError("Cuenta no encontrada.", 404, "ACCOUNT_NOT_FOUND");
  }
  return accountDTO(account);
}
