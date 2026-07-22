import { Schema, model, Types, type InferSchemaType } from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema>;
export const PasswordResetToken = model("PasswordResetToken", passwordResetTokenSchema);
