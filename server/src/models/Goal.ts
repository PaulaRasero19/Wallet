import { Schema, model, Types, type InferSchemaType } from "mongoose";

const goalHistorySchema = new Schema(
  {
    month: { type: String, required: true, trim: true },
    saved: { type: Number, required: true, min: 0 },
    target: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const goalSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    target: { type: Number, required: true, min: 0 },
    saved: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, default: "UYU" },
    monthlyContribution: { type: Number, required: true, min: 0 },
    accent: { type: String, required: true, default: "lime" },
    history: { type: [goalHistorySchema], default: [] }
  },
  { timestamps: true, versionKey: false }
);

goalSchema.index({ userId: 1, name: 1 }, { unique: true });

export type GoalDocument = InferSchemaType<typeof goalSchema>;
export const Goal = model("Goal", goalSchema);
