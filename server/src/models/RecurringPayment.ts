import { Schema, model, Types, type InferSchemaType } from "mongoose";

const recurringPaymentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    merchant: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, default: "UYU" },
    frequency: { type: String, enum: ["weekly", "monthly", "annual"], required: true },
    nextChargeDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "confirmed", "rejected"], required: true, default: "pending" },
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
