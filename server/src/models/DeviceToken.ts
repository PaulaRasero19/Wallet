import { Schema, model, Types, type InferSchemaType } from "mongoose";

const deviceTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, trim: true, index: true },
    platform: { type: String, required: true, trim: true, default: "unknown" },
    active: { type: Boolean, required: true, default: true },
    lastUsedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

export type DeviceTokenDocument = InferSchemaType<typeof deviceTokenSchema>;
export const DeviceToken = model("DeviceToken", deviceTokenSchema);
