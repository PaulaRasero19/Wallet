import { Schema, model, Types, type InferSchemaType } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    accountId: { type: Types.ObjectId, ref: "Account", required: true, index: true },
    categoryId: { type: Types.ObjectId, ref: "Category", default: null, index: true },
    toAccountId: { type: Types.ObjectId, ref: "Account", default: null, index: true },
    transferGroupId: { type: String, trim: true, default: null, index: true },
    scheduledPaymentId: { type: Types.ObjectId, ref: "RecurringPayment", default: null, index: true },
    receiptUrl: { type: String, trim: true, default: null },
    demoId: { type: String, trim: true, default: null },
    type: { type: String, enum: ["income", "expense", "transfer", "refund", "goal_contribution", "internal_transfer"], required: true, index: true },
    status: { type: String, enum: ["completed", "received", "paid", "pending", "cancelled", "deleted"], required: true, default: "completed", index: true },
    title: { type: String, required: true, trim: true },
    merchant: { type: String, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, index: true },
    date: { type: Date, required: true, index: true },
    note: { type: String, trim: true, default: null },
    paymentMethod: { type: String, trim: true, default: "" },
    weekday: { type: String, trim: true, default: "" },
    hour: { type: Number, min: 0, max: 23, default: null },
    isRecurring: { type: Boolean, default: false },
    isAntExpense: { type: Boolean, default: false },
    installment: {
      current: { type: Number, min: 1, default: null },
      total: { type: Number, min: 1, default: null },
      amountPerInstallment: { type: Number, min: 0, default: null },
      remainingAmount: { type: Number, min: 0, default: null },
      nextDueDate: { type: String, trim: true, default: null }
    }
  },
  { timestamps: true, versionKey: false }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index(
  { userId: 1, demoId: 1 },
  { name: "unique_demo_transaction", unique: true, partialFilterExpression: { demoId: { $type: "string" } } }
);
transactionSchema.index({ userId: 1, title: "text", merchant: "text", note: "text" });

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;
export const Transaction = model("Transaction", transactionSchema);
