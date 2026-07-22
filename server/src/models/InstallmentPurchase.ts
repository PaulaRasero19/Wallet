import { Schema, model, Types, type InferSchemaType } from "mongoose";

const installmentSchema = new Schema(
  {
    number: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "paid"], required: true, default: "pending" },
    paidAt: { type: Date, default: null },
    transactionId: { type: Types.ObjectId, ref: "Transaction", default: null }
  },
  { _id: true }
);

const installmentPurchaseSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    accountId: { type: Types.ObjectId, ref: "Account", default: null },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    installmentAmount: { type: Number, required: true, min: 0 },
    totalInstallments: { type: Number, required: true, min: 1 },
    paidInstallments: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, default: "UYU" },
    firstDueDate: { type: Date, required: true },
    reminderDaysBefore: { type: Number, min: 0, max: 30, default: 3 },
    status: { type: String, enum: ["active", "completed"], required: true, default: "active", index: true },
    installments: { type: [installmentSchema], default: [] }
  },
  { timestamps: true, versionKey: false }
);

installmentPurchaseSchema.index({ userId: 1, status: 1 });

export type InstallmentPurchaseDocument = InferSchemaType<typeof installmentPurchaseSchema>;
export const InstallmentPurchase = model("InstallmentPurchase", installmentPurchaseSchema);
