import { Schema, model, Types, type InferSchemaType } from "mongoose";

const recurringPaymentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    merchant: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, default: "UYU" },
    frequency: { type: String, enum: ["once", "weekly", "monthly", "annual"], required: true },
    nextChargeDate: { type: Date, required: true },
    reminderDaysBefore: { type: Number, min: 0, max: 30, default: 3 },
    accountId: { type: Types.ObjectId, ref: "Account", default: null },
    categoryId: { type: Types.ObjectId, ref: "Category", default: null },
    active: { type: Boolean, default: true, index: true },
    lastPaidAt: { type: Date, default: null },
    lastTransactionId: { type: Types.ObjectId, ref: "Transaction", default: null },
    status: { type: String, enum: ["pending", "confirmed", "rejected", "paid"], required: true, default: "pending" },
    kind: { type: String, enum: ["fixed", "subscription", "service"], required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    priceChange: { type: Number, default: null },
    duplicateGroup: { type: String, trim: true, default: null }
  },
  { timestamps: true, versionKey: false }
);

recurringPaymentSchema.index({ userId: 1, merchant: 1, nextChargeDate: 1 });

export type RecurringPaymentDocument = InferSchemaType<typeof recurringPaymentSchema>;
export const RecurringPayment = model("RecurringPayment", recurringPaymentSchema);
