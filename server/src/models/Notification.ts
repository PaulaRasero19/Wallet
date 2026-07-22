import { Schema, model, Types, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "read", "completed", "snoozed"], required: true, default: "pending", index: true },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], required: true, default: "normal" },
    readAt: { type: Date, default: null },
    scheduledFor: { type: Date, default: null, index: true },
    relatedEntityType: { type: String, trim: true, default: "" },
    relatedEntityId: { type: Types.ObjectId, default: null },
    actionType: { type: String, trim: true, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
notificationSchema.index({ userId: 1, status: 1, scheduledFor: 1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);
