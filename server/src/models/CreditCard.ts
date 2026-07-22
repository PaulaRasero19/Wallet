import { Schema, model, Types, type InferSchemaType } from "mongoose";

const creditCardSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    bank: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    mask: { type: String, required: true, trim: true },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, default: "UYU" },
    limit: { type: Number, required: true, min: 0 },
    used: { type: Number, required: true, min: 0 },
    closingDate: { type: String, required: true, trim: true },
    dueDate: { type: String, required: true, trim: true },
    nextPaymentAmount: { type: Number, required: true, min: 0 },
    accent: { type: String, required: true, default: "blue" }
  },
  { timestamps: true, versionKey: false }
);

creditCardSchema.index({ userId: 1, name: 1 }, { unique: true });

export type CreditCardDocument = InferSchemaType<typeof creditCardSchema>;
export const CreditCard = model("CreditCard", creditCardSchema);
