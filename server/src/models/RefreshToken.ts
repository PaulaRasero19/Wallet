import { Schema, model, Types, type InferSchemaType } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null }
  },
  { timestamps: true, versionKey: false }
);

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema>;
export const RefreshToken = model("RefreshToken", refreshTokenSchema);
