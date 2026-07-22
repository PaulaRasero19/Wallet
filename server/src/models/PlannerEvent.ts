import { Schema, model, Types, type InferSchemaType } from "mongoose";

const plannerEventSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    accent: { type: String, required: true, default: "black" }
  },
  { timestamps: true, versionKey: false }
);

plannerEventSchema.index({ userId: 1, date: 1 });

export type PlannerEventDocument = InferSchemaType<typeof plannerEventSchema>;
export const PlannerEvent = model("PlannerEvent", plannerEventSchema);
