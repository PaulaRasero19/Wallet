import { Schema, model, Types, type InferSchemaType } from "mongoose";

const accountSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["cash", "bank", "savings", "wallet", "credit", "other"], required: true },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true },
    initialBalance: { type: Number, required: true, default: 0 },
    currentBalance: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

accountSchema.index({ userId: 1, isActive: 1 });

export type AccountDocument = InferSchemaType<typeof accountSchema>;
export const Account = model("Account", accountSchema);
